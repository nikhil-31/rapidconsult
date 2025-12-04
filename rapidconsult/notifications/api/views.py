from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from ..models import UserDevice
from .serializers import UserDeviceSerializer

class DeviceViewSet(mixins.CreateModelMixin,
                    mixins.DestroyModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = UserDeviceSerializer
    permission_classes = [IsAuthenticated]
    queryset = UserDevice.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'])
    def unregister(self, request):
        registration_id = request.data.get('registration_id')
        if not registration_id:
            return Response({'error': 'registration_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count, _ = UserDevice.objects.filter(user=request.user, registration_id=registration_id).delete()
        
        if deleted_count > 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)
