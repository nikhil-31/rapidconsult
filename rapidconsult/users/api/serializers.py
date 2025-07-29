from rest_framework import serializers

from rapidconsult.users.models import User, Contact
from scheduling.models import UserOrgProfile


# class UserSerializer(serializers.ModelSerializer[User]):
#     class Meta:
#         model = User
#         fields = ["username", "name", "profile_picture", "pk", "email"]


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'label', 'type', 'country_code', 'number', 'primary']
        read_only_fields = ['id']

    def validate(self, data):
        user = self.context['request'].user
        if data.get('primary'):
            # Unset any other primary contact
            Contact.objects.filter(user=user, primary=True).update(primary=False)
        return data


class UserOrgProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOrgProfile
        fields = ['organisation', 'role', 'job_title']


class UserSerializer(serializers.ModelSerializer):
    org_profile = UserOrgProfileCreateSerializer(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "name", "email", "profile_picture", "id", "org_profile", "password"]
        extra_kwargs = {
            "profile_picture": {"required": False},
        }

    def get_queryset(self):
        user = self.request.user
        org_profiles = user.org_profiles.all()
        if not org_profiles.exists():
            return User.objects.none()

        org_ids = [org_profile.organisation_id for org_profile in org_profiles]
        return User.objects.filter(org_profiles__organisation_id__in=org_ids).distinct()

    def create(self, validated_data):
        org_profile_data = validated_data.pop("org_profile")
        password = validated_data.pop("password", None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        UserOrgProfile.objects.create(user=user, **org_profile_data)
        return user
