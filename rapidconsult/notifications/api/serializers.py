from rest_framework import serializers
from ..models import UserDevice

class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDevice
        fields = ['id', 'registration_id', 'type', 'active', 'date_created', 'device_type']
        read_only_fields = ['id', 'date_created']

    def create(self, validated_data):
        user = self.context['request'].user
        registration_id = validated_data.get('registration_id')
        type = validated_data.get('type', 'fcm')
        os = validated_data.get('device_type')

        device, created = UserDevice.objects.update_or_create(
            registration_id=registration_id,
            defaults={
                'user': user,
                'type': type,
                'active': True,
                'device_type': os,
            }
        )
        return device
