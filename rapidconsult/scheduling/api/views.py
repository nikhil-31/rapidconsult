from rest_framework import viewsets
from scheduling.models import Location, Department, Unit, Organization
from .serializers import LocationSerializer, DepartmentSerializer, UnitSerializer, OrganizationSerializer
from rest_framework.permissions import IsAuthenticated


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Location.objects.all()
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            queryset = queryset.filter(organization__id=org_id)
        return queryset


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Department.objects.all()
        location_id = self.request.query_params.get('location_id')
        if location_id:
            queryset = queryset.filter(location__id=location_id)
        return queryset


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Unit.objects.all()
        department_id = self.request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(department__id=department_id)
        return queryset
