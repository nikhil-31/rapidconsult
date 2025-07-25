from rest_framework import serializers

from rapidconsult.users.models import User, Contact


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["username", "name", "profile_picture", "pk"]



class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'number', 'country_code', 'label',
            'verified', 'primary', 'type'
        ]
