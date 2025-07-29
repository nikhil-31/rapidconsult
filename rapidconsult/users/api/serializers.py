from rest_framework import serializers

from rapidconsult.users.models import User, Contact


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["username", "name", "profile_picture", "pk", "email"]


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
