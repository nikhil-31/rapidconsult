from rest_framework import serializers

from config.roles import get_permissions_for_role
from rapidconsult.users.models import User, Contact
from rapidconsult.scheduling.models import UserOrgProfile


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'label', 'type', 'country_code', 'number', 'primary']
        read_only_fields = ['id']

    def validate(self, data):
        user = self.context['request'].user
        if data.get('primary'):
            Contact.objects.filter(user=user, primary=True).update(primary=False)
        return data


class UserOrgProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOrgProfile
        fields = ['organization', 'role', 'job_title']


class UserSerializer(serializers.ModelSerializer):
    org_profile = UserOrgProfileCreateSerializer(write_only=True)
    password = serializers.CharField(write_only=True)
    organizations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "name", "email", "profile_picture", "id", "org_profile", "password", "organizations", ]
        extra_kwargs = {
            "profile_picture": {"required": False},
        }

    def get_organizations(self, user):
        org_profiles = user.org_profiles.select_related("organization", "role")
        from scheduling.api.serializers import OrganizationSerializer, RoleSerializer, LocationSerializer
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
        return orgs_data

    def get_queryset(self):
        user = self.request.user
        org_profiles = user.org_profiles.all()
        if not org_profiles.exists():
            return User.objects.none()

        org_ids = [org_profile.organization_id for org_profile in org_profiles]
        return User.objects.filter(org_profiles__organization_id__in=org_ids).distinct()

    def create(self, validated_data):
        org_profile_data = validated_data.pop("org_profile")
        password = validated_data.pop("password", None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        UserOrgProfile.objects.create(user=user, **org_profile_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        org_profile_data = validated_data.pop("org_profile", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        # Update org profile if included
        if org_profile_data:
            user_org_profile = instance.org_profiles.filter(
                organization_id=org_profile_data["organization"]
            ).first()

            if user_org_profile:
                user_org_profile.role_id = org_profile_data.get("role", user_org_profile.role_id)
                user_org_profile.job_title = org_profile_data.get("job_title", user_org_profile.job_title)
                user_org_profile.save()

        return instance
