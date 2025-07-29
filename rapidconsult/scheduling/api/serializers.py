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
    address = AddressSerializer()
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all())
    display_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Location
        fields = ["id", "name", "organization", "address", "display_picture"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.display_picture and request:
            data['display_picture'] = request.build_absolute_uri(instance.display_picture.url)
        return data

    def create(self, validated_data):
        address_data = validated_data.pop("address", None)
        if address_data:
            address, _ = Address.objects.get_or_create(**address_data)
            validated_data["address"] = address
        return super().create(validated_data)

    def update(self, instance, validated_data):
        address_data = validated_data.pop("address", None)
        if address_data:
            if instance.address:
                for key, value in address_data.items():
                    setattr(instance.address, key, value)
                instance.address.save()
            else:
                instance.address = Address.objects.create(**address_data)
        return super().update(instance, validated_data)


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
        read_only_fields = ['username']
