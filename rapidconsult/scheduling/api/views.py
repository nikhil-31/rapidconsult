from datetime import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from rapidconsult.chats.api.mongo import handle_consult_update_system_message
from rapidconsult.chats.api.mongo import create_group_chat, add_user_to_group_chat, remove_user_from_group_chat
from rapidconsult.chats.api.permissions import HasOrgLocationAccess
from rapidconsult.scheduling.api.permissions import check_org_admin_or_raise
from rapidconsult.scheduling.models import Location, Department, Organization, Role, UnitMembership, Unit, OnCallShift, \
    UserOrgProfile, Consultation
from .serializers import LocationSerializer, DepartmentSerializer, UnitSerializer, OrganizationSerializer, \
    UserProfileSerializer, UnitWriteSerializer, OnCallShiftSerializer, RoleSerializer, UnitMembershipSerializer, \
    UserOrgProfileSerializer, UserOrgProfileLocationUpdateSerializer, ConsultationSerializer

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

        # Apply pagination if configured
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback: no pagination
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
        # check_org_admin_or_raise(self.request.user, org)

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
            organization_id=str(department.location.organization_id),
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


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class OnCallShiftViewSet(viewsets.ModelViewSet):
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
        shift_type = self.request.query_params.get('shift_type')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

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

        if shift_type in ['oncall', 'outpatient']:
            queryset = queryset.filter(shift_type=shift_type)

        # -------------------------
        # DATE RANGE FILTER
        # -------------------------
        if start_date and end_date:
            try:
                start_dt = parse_datetime(start_date) or datetime.fromisoformat(start_date)
                end_dt = parse_datetime(end_date) or datetime.fromisoformat(end_date)

                # Ensure end_dt covers the full end date (e.g., 2025-11-10 → include entire day)
                if end_dt.time() == datetime.min.time():
                    from datetime import timedelta
                    end_dt = end_dt + timedelta(days=1)

                # Include shifts that start OR end within the range, or overlap it
                queryset = queryset.filter(
                    start_time__lt=end_dt,
                    end_time__gte=start_dt
                )
            except Exception:
                pass

        return queryset


class ConsultationViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationSerializer
    queryset = Consultation.objects.all().select_related(
        "organization", "location", "department", "unit",
        "referred_by_doctor__user", "referred_to_doctor__user",
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "urgency", "organization", "location", "unit"]
    search_fields = ["patient_name", "diagnosis", "reason_for_referral"]
    ordering_fields = ["created_at", "updated_at", "consultation_datetime"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated, HasOrgLocationAccess]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Get all UserOrgProfiles linked to this user
        user_org_profiles = user.org_profiles.all()
        # Filter consultations referred by this user's org profile(s)
        queryset = queryset.filter(referred_by_doctor__in=user_org_profiles)

        # --- Optional filters from query params ---
        organization_id = self.request.query_params.get("organization_id")
        location_id = self.request.query_params.get("location_id")
        status_param = self.request.query_params.get("status")
        urgency_param = self.request.query_params.get("urgency")

        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if urgency_param:
            queryset = queryset.filter(urgency=urgency_param)

        return queryset

    def perform_create(self, serializer):
        """
        Handles saving related fields (like department) correctly.
        """
        return serializer.save()

    def perform_update(self, serializer):
        """
        Handles updating related fields correctly.
        """
        return serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consult = self.perform_create(serializer)

        # Send system message to referred_to_user
        handle_consult_update_system_message(consult)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        consult = self.perform_update(serializer)

        # Send system message to referred_by_user
        handle_consult_update_system_message(consult)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"detail": "Consultation deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
