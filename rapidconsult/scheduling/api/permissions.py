from rest_framework import permissions

from rest_framework.exceptions import PermissionDenied


class IsOrgAdminForObject(permissions.BasePermission):
    """
    Allows access only to users with an admin-role in the object's organization.
    """

    def has_object_permission(self, request, view, obj):
        return request.user.org_profiles.filter(
            organization=obj.organization, role__name__iexact="admin"
        ).exists()


def check_org_admin_or_raise(user, org):
    if not user.org_profiles.filter(
        organization=org, role__name__iexact="admin"
    ).exists():
        raise PermissionDenied("Only organization admins can perform this action.")

