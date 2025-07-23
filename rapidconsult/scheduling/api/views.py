from rest_framework import viewsets
from scheduling.models import OnCallShift
from rest_framework import generics, permissions


# class OnCallShiftViewSet(viewsets.ModelViewSet):
#     queryset = OnCallShift.objects.all()
#     serializer_class = OnCallShiftSerializer
#     permission_classes = [permissions.IsAuthenticated]
#
#     def get_queryset(self):
#         """
#         Optionally filter shifts for the logged-in user's organization or team.
#         """
#         user = self.request.user
#         return OnCallShift.objects.filter(user__in=user.teams.all().values_list("members", flat=True)).distinct()
