from rest_framework import viewsets
from scheduling.models import OnCallShift
from scheduling.api.serializers import OnCallShiftSerializer


class OnCallShiftViewSet(viewsets.ModelViewSet):
    queryset = OnCallShift.objects.all()
    serializer_class = OnCallShiftSerializer
