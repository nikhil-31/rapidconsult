from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from chats.api.mongo import create_group_chat, add_user_to_group_chat, remove_user_from_group_chat
from rapidconsult.scheduling.api.permissions import check_org_admin_or_raise
from rapidconsult.scheduling.models import Location, Department, Organization, Role, UnitMembership, Unit, OnCallShift, \
    UserOrgProfile
from .serializers import LocationSerializer, DepartmentSerializer, UnitSerializer, OrganizationSerializer, \
    UserProfileSerializer, UnitWriteSerializer, OnCallShiftSerializer, RoleSerializer, UnitMembershipSerializer, \
    UserOrgProfileSerializer, UserOrgProfileLocationUpdateSerializer
from django.shortcuts import get_object_or_404

User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]


class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get("organization_id")
        qs = Location.objects.all()

        if org_id:
            if not self.request.user.org_profiles.filter(organization_id=org_id).exists():
                raise PermissionDenied("You do not belong to this organization.")
            qs = qs.filter(organization_id=org_id)

        return qs

    def perform_create(self, serializer):
        org = serializer.validated_data.get("organization")
        check_org_admin_or_raise(self.request.user, org)
        serializer.save()

    def perform_update(self, serializer):
        if 'organization' in serializer.validated_data:
            serializer.validated_data.pop('organization')
        check_org_admin_or_raise(self.request.user, serializer.instance.organization)
        serializer.save()

    def perform_destroy(self, instance):
        check_org_admin_or_raise(self.request.user, instance.organization)
        instance.delete()


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Department.objects.select_related('location', 'location__organization').all()
        location_id = self.request.query_params.get('location_id')
        org_id = self.request.query_params.get('organization_id')

        if org_id:
            # Filter departments through organization relationship via location
            queryset = queryset.filter(location__organization__id=org_id)
            if not self.request.user.org_profiles.filter(organization_id=org_id).exists():
                raise PermissionDenied("You do not belong to this organization.")

        if location_id:
            queryset = queryset.filter(location_id=location_id)

        return queryset

    def perform_create(self, serializer):
        org = serializer.validated_data['location'].organization
        check_org_admin_or_raise(self.request.user, org)
        serializer.save()

    def perform_update(self, serializer):
        org = serializer.instance.location.organization
        check_org_admin_or_raise(self.request.user, org)

        # Prevent changing organization via location reassignment
        if 'location' in serializer.validated_data:
            new_org = serializer.validated_data['location'].organization
            if new_org != org:
                raise PermissionDenied("Cannot change the organization of the department.")

        serializer.save()

    def perform_destroy(self, instance):
        org = instance.location.organization
        check_org_admin_or_raise(self.request.user, org)
        instance.delete()

    @action(detail=False, methods=["get"], url_path="org")
    def by_organization(self, request):
        org_id = request.query_params.get("organization_id")
        if not org_id:
            return Response({"detail": "Missing organization_id"}, status=400)

        if not request.user.org_profiles.filter(organization_id=org_id).exists():
            raise PermissionDenied("You do not belong to this organization.")

        queryset = Department.objects.filter(location__organization__id=org_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UnitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get('organization_id')
        department_id = self.request.query_params.get('department_id')

        queryset = Unit.objects.select_related(
            'department',
            'department__location',
            'department__location__organization'
        )

        if org_id:
            if not self.request.user.org_profiles.filter(organization_id=org_id).exists():
                raise PermissionDenied("You do not belong to this organization.")
            queryset = queryset.filter(department__location__organization_id=org_id)

        if department_id:
            queryset = queryset.filter(department_id=department_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method in ['GET']:
            return UnitSerializer
        return UnitWriteSerializer

    def perform_create(self, serializer):
        department = serializer.validated_data['department']
        org = department.location.organization
        check_org_admin_or_raise(self.request.user, org)

        # Save the Unit first
        unit = serializer.save()

        # The Current logged-in user is the creator
        created_by_id = str(self.request.user.id)

        # Collect unit members
        member_ids = list(unit.members.values_list("id", flat=True))
        if created_by_id not in member_ids:
            member_ids.append(created_by_id)

        # Create the Mongo group chat
        create_group_chat(
            created_by_id=created_by_id,
            name=unit.name,
            description=f"Group chat for unit {unit.name}",
            member_ids=[str(mid) for mid in member_ids],
            location_id=str(department.location_id),
            organization_id=str(department.location_id.organization_id),
            unit_id=str(unit.id),
        )

    def perform_update(self, serializer):
        department = serializer.instance.department
        org = department.location.organization
        check_org_admin_or_raise(self.request.user, org)

        if 'department' in serializer.validated_data:
            new_org = serializer.validated_data['department'].location.organization
            if new_org != org:
                raise PermissionDenied("Cannot change the organization of the unit.")

        serializer.save()

    def perform_destroy(self, instance):
        org = instance.department.location.organization
        check_org_admin_or_raise(self.request.user, org)
        instance.delete()


class UnitMembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UnitMembershipSerializer

    def get_queryset(self):
        """
        Optionally, filters UnitMemberships by `organization_id`
        if provided as a query parameter.
        """
        org_id = self.request.query_params.get('organization_id')
        unit_id = self.request.query_params.get('unit_id')

        queryset = UnitMembership.objects.select_related(
            'unit', 'unit__department', 'unit__department__location__organization',
            'user', 'user__organization', 'user__role'
        )

        if org_id:
            if not self.request.user.org_profiles.filter(organization_id=org_id).exists():
                raise PermissionDenied("You do not belong to this organization.")
            queryset = queryset.filter(
                unit__department__location__organization_id=org_id
            )

        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)

        return queryset

    def validate_org_membership(self, unit, user_profile):
        unit_org = unit.department.location.organization
        if user_profile.organization != unit_org:
            raise PermissionDenied("User must belong to the same organization as the unit.")

    def perform_create(self, serializer):
        """
        Enforce that only org admins can create unit memberships.
        """
        unit = serializer.validated_data.get('unit')
        user_profile = serializer.validated_data.get('user')

        org = unit.department.location.organization
        check_org_admin_or_raise(self.request.user, org)

        # Check if the user being assigned belongs to the same org
        self.validate_org_membership(unit, user_profile)

        membership = serializer.save()

        sql_user_id = str(user_profile.user.id)  # Django User.id
        add_user_to_group_chat(unit_id=unit.id, user_id=sql_user_id, is_admin=membership.is_admin)

    def perform_update(self, serializer):
        """
        Enforce that only org admins can update unit memberships.
        """
        unit = serializer.instance.unit
        org = unit.department.location.organization
        check_org_admin_or_raise(self.request.user, org)

        # Optional: prevent changing unit across orgs - this will not happen
        new_unit = serializer.validated_data.get('unit')
        if new_unit and new_unit.department.location.organization != org:
            raise PermissionDenied("Cannot change to a unit from another organization.")

        membership = serializer.save()

        sql_user_id = str(membership.user.user.id)
        remove_user_from_group_chat(unit_id=membership.unit.id, user_id=sql_user_id)
        add_user_to_group_chat(unit_id=membership.unit.id, user_id=sql_user_id, is_admin=membership.is_admin)

    def perform_destroy(self, instance):
        """
        Enforce that only org admins can delete unit memberships.
        """
        org = instance.unit.department.location.organization
        check_org_admin_or_raise(self.request.user, org)

        sql_user_id = str(instance.user.user.id)
        remove_user_from_group_chat(unit_id=instance.unit.id, user_id=sql_user_id)

        instance.delete()


class UserOrgProfileViewSet(viewsets.ModelViewSet):
    queryset = UserOrgProfile.objects.all()
    serializer_class = UserOrgProfileSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['patch'], url_path='update-locations')
    def update_locations(self, request, pk=None):
        profile = self.get_object()
        serializer = UserOrgProfileLocationUpdateSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'org_profile': profile}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Locations updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

    def get_object(self):
        return get_object_or_404(self.get_queryset(), pk=self.kwargs.get("pk"))

    @action(detail=False, methods=["get", "put", "patch"])
    def me(self, request):
        user = self.request.user
        if request.method in ["PUT", "PATCH"]:
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class RoleViewSet(ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class OnCallShiftViewSet(ModelViewSet):
    serializer_class = OnCallShiftSerializer
    permission_classes = [IsAuthenticated]
    queryset = OnCallShift.objects.all()
    filter_backends = [DjangoFilterBackend, OrderingFilter]

    def get_queryset(self):
        queryset = super().get_queryset()

        unit_id = self.request.query_params.get('unit')
        department_id = self.request.query_params.get('department')
        location_id = self.request.query_params.get('location')
        user_id = self.request.query_params.get('user')

        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)

        if department_id:
            queryset = queryset.filter(unit__department_id=department_id)

        if user_id and location_id:
            queryset = queryset.filter(
                user_id=user_id,
                unit__department__location_id=location_id
            )

        if location_id:
            queryset = queryset.filter(unit__department__location_id=location_id)

        return queryset
