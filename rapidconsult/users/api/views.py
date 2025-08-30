from rest_framework import status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.authtoken.models import Token

from rapidconsult.users.models import User, Contact
from rapidconsult.scheduling.api.serializers import OrganizationSerializer, RoleSerializer, LocationSerializer

from .serializers import UserSerializer
from config.roles import get_permissions_for_role
from rest_framework import viewsets, permissions
from .serializers import ContactSerializer


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"

    @action(detail=False, methods=["post"], url_path="register")
    def register_user(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def all(self, request):
        org_id = request.query_params.get("organization")
        location_id = request.query_params.get("location_id")
        queryset = self.queryset

        if org_id:
            queryset = queryset.filter(
                org_profiles__organization_id=org_id
            ).distinct()

        if location_id:
            queryset = queryset.filter(
                org_profiles__allowed_locations__id=location_id
            ).distinct()

        serializer = UserSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(status=status.HTTP_200_OK, data=serializer.data)


class CustomObtainAuthTokenView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        org_profiles = user.org_profiles.select_related('organization', 'role')
        orgs_data = []
        for profile in org_profiles:
            org_data = {
                "id": profile.id,
                "organization": OrganizationSerializer(profile.organization).data,
                "role": RoleSerializer(profile.role).data if profile.role else None,
                "job_title": profile.job_title,
                "permissions": get_permissions_for_role(profile.role.name) if profile.role else [],
                "allowed_locations": LocationSerializer(profile.allowed_locations.all(), many=True).data,
            }
            orgs_data.append(org_data)

        return Response({
            "id": user.id,
            "token": token.key,
            "username": user.username,
            "profile_picture": request.build_absolute_uri(user.profile_picture.url)
            if user.profile_picture else None,
            "organizations": orgs_data
        })


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
