from rest_framework import serializers
from scheduling.models import OnCallShift, Team, Role
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = "__all__"


class OnCallShiftSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    team = TeamSerializer()
    role = RoleSerializer()

    class Meta:
        model = OnCallShift
        fields = "__all__"
