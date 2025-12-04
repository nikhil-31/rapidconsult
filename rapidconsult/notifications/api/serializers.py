from rest_framework import serializers
from ..models import UserDevice

class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDevice
        fields = ['id', 'registration_id', 'type', 'active', 'date_created']
        read_only_fields = ['id', 'date_created']

    def create(self, validated_data):
        user = self.context['request'].user
        registration_id = validated_data.get('registration_id')
        device_type = validated_data.get('type', 'fcm')
        
        device, created = UserDevice.objects.update_or_create(
            registration_id=registration_id,
            defaults={
                'user': user,
                'type': device_type,
                'active': True
            }
        )
        return device
