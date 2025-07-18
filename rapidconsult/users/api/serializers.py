from rest_framework import serializers

from rapidconsult.users.models import User


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["username", "name", "profile_picture", "pk"]
