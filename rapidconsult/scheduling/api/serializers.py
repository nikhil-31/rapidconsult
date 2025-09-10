from django.contrib.auth import get_user_model
from rest_framework import serializers

from config.roles import get_permissions_for_role
from rapidconsult.scheduling.models import (Address, Organization, Location, Department, Unit, UserOrgProfile,
                                            UnitMembership, Role,
                                            OnCallShift)
from rapidconsult.users.api.serializers import ContactSerializer
from rapidconsult.chats.api.serializers import UserConversationSerializer

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
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True
    )
    location_details = LocationSerializer(source='location', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'location', 'location_details', 'display_picture']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class UserOrgProfileLocationUpdateSerializer(serializers.ModelSerializer):
    allowed_locations = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Location.objects.all()
    )

    class Meta:
        model = UserOrgProfile
        fields = ['allowed_locations']

    def validate_allowed_locations(self, locations):
        profile = self.instance or self.context.get("org_profile")
        for loc in locations:
            if loc.organization_id != profile.organization_id:
                raise serializers.ValidationError(
                    f"Location '{loc.name}' does not belong to the same organization."
                )
        return locations


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'profile_picture']


class UserOrgProfileSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer()
    role = RoleSerializer()
    allowed_locations = LocationSerializer(many=True)
    permissions = serializers.SerializerMethodField()
    user = UserSummarySerializer()

    class Meta:
        model = UserOrgProfile
        fields = ['id', 'organization', 'role', 'job_title', 'allowed_locations', 'permissions', 'user']

    def get_permissions(self, obj):
        if obj.role:
            return get_permissions_for_role(obj.role.name)
        return []


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


class UnitMembershipSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserOrgProfile.objects.all())
    user_details = UserOrgProfileSerializer(source='user', read_only=True)

    class Meta:
        model = UnitMembership
        fields = ['id', 'unit', 'user', 'is_admin', 'joined_at', 'user_details']
        read_only_fields = ['id', 'joined_at']


class UnitWriteSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    members = UnitMembershipSerializer(source='unitmembership_set', many=True, required=False)

    class Meta:
        model = Unit
        fields = ['id', 'name', 'department', 'display_picture', 'members']

    def create(self, validated_data):
        members_data = validated_data.pop('unitmembership_set', [])
        unit = Unit.objects.create(**validated_data)
        for member in members_data:
            UnitMembership.objects.create(unit=unit, **member)
        return unit

    def update(self, instance, validated_data):
        members_data = validated_data.pop('unitmembership_set', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if members_data is not None:
            instance.unitmembership_set.all().delete()
            for member in members_data:
                UnitMembership.objects.create(unit=instance, **member)
        return instance


class UnitSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    members = UnitMembershipSerializer(source='unitmembership_set', many=True, required=False)
    oncall = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'name', 'department', 'display_picture', 'members', 'oncall', 'conversation']

    def create(self, validated_data):
        members_data = validated_data.pop('unitmembership_set', [])
        unit = Unit.objects.create(**validated_data)
        for member in members_data:
            UnitMembership.objects.create(unit=unit, **member)
        return unit

    def update(self, instance, validated_data):
        members_data = validated_data.pop('unitmembership_set', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if members_data is not None:
            # Clear existing and replace
            instance.unitmembership_set.all().delete()
            for member in members_data:
                UnitMembership.objects.create(unit=instance, **member)
        return instance

    def get_oncall(self, obj):
        shifts = obj.get_current_oncall_shifts()
        results = []
        for shift in shifts:
            user_profile = shift.user  # UserOrgProfile
            user = user_profile.user  # AUTH_USER_MODEL instance

            # Find primary contact
            primary_contact = None
            if hasattr(user, "phone_numbers"):
                contact_qs = user.phone_numbers.all()
                primary_contact = contact_qs.filter(primary=True).first() or contact_qs.first()

            results.append({
                "id": shift.id,
                "user_id": user_profile.id,
                "name": user.name,
                "job_title": user_profile.job_title,
                "shift_start": shift.start_time,
                "shift_end": shift.end_time,
                "primary_contact": ContactSerializer(primary_contact).data if primary_contact else None,
            })
        return results

    def get_conversation(self, obj):
        """
        Return the current user's UserConversation for this unit, if any.
        """
        from rapidconsult.chats.mongo.models import UserConversation  # adjust to your actual path

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        # Use Django user.id
        user_id = str(request.user.id)

        user_conversation = UserConversation.objects(
            userId=user_id,
            unitId=str(obj.id),
            conversationType="group"
        ).first()

        if not user_conversation:
            return None

        return UserConversationSerializer(user_conversation).data


class OnCallShiftSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserOrgProfile.objects.all(), write_only=True)
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), write_only=True)

    user_details = UserOrgProfileSerializer(source='user', read_only=True)
    unit_details = UnitSerializer(source='unit', read_only=True)

    class Meta:
        model = OnCallShift
        fields = ['id', 'user', 'unit', 'start_time', 'end_time', 'user_details', 'unit_details']
