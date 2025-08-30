from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from rapidconsult.scheduling.models import UserOrgProfile


class HasOrgLocationAccess(BasePermission):
    """
    Permission that checks if a user belongs to an organization
    and has access to the given location.
    """

    def has_permission(self, request, view):
        user = request.user
        organization_id = request.data.get("organization_id") or request.query_params.get("organization_id")
        location_id = request.data.get("location_id") or request.query_params.get("location_id")

        if not organization_id or not location_id:
            raise PermissionDenied("You must specify an organization and location")

        try:
            org_profile = UserOrgProfile.objects.get(
                user_id=user.id,
                organization_id=organization_id
            )
        except UserOrgProfile.DoesNotExist:
            raise PermissionDenied("User is not part of this organization")

        allowed_location_ids = [str(loc.id) for loc in org_profile.allowed_locations.all()]
        if str(location_id) not in allowed_location_ids:
            raise PermissionDenied("User does not have access to this location")

        return True
