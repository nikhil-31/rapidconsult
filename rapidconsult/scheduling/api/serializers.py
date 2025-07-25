from django.contrib.auth import get_user_model
from rest_framework import serializers
from scheduling.models import Address, Organization, Location, Department, Unit, UserOrgProfile, UnitMembership, Role
from users.api.serializers import ContactSerializer
from rapidconsult.users.models import User

User = get_user_model()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'


class OrganizationSerializer(serializers.ModelSerializer):
    address = AddressSerializer()

    class Meta:
        model = Organization
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer()
    address = AddressSerializer()

    class Meta:
        model = Location
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    location = LocationSerializer()

    class Meta:
        model = Department
        fields = '__all__'


class UnitSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = '__all__'

    def get_members(self, obj):
        memberships = UnitMembership.objects.filter(unit=obj)
        return [
            {
                "id": membership.user.id,
                "user": str(membership.user.user),
                "job_title": membership.user.job_title,
                "role": str(membership.user.role.name) if membership.user.role else None,
                "is_admin": membership.is_admin,
                "joined_at": membership.joined_at
            }
            for membership in memberships
        ]


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class UserOrgProfileSerializer(serializers.ModelSerializer):
    organisation = OrganizationSerializer()
    role = RoleSerializer()

    class Meta:
        model = UserOrgProfile
        fields = ['id', 'organisation', 'role', 'job_title']


class UserProfileSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(source='phone_numbers', many=True)
    organizations = UserOrgProfileSerializer(source='org_profiles', many=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'profile_picture',
            'contacts', 'organizations'
        ]
