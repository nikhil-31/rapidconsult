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

from .serializers import UserSerializer
from config.roles import get_permissions_for_role
from rest_framework import viewsets, permissions
from .serializers import ContactSerializer


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"

    # def get_queryset(self, *args, **kwargs):
    #     assert isinstance(self.request.user.id, int)
    #     return self.queryset.filter(id=self.request.user.id)
    #
    # @action(detail=False)
    # def me(self, request):
    #     serializer = UserSerializer(request.user, context={"request": request})
    #     return Response(status=status.HTTP_200_OK, data=serializer.data)

    @action(detail=False)
    def all(self, request):
        serializer = UserSerializer(
            User.objects.all(), many=True, context={"request": request}
        )
        return Response(status=status.HTTP_200_OK, data=serializer.data)


class CustomObtainAuthTokenView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        org_profiles = user.org_profiles.select_related('organisation', 'role')
        orgs_data = []
        for profile in org_profiles:
            orgs_data.append({
                "organization_id": profile.organisation.id,
                "organization_name": profile.organisation.name,
                "role": profile.role.name if profile.role else None,
                "job_title": profile.job_title,
                # Add any derived permissions if needed:
                "permissions": get_permissions_for_role(profile.role.name) if profile.role else [],
            })

        return Response({
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
