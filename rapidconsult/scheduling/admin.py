from django.contrib import admin
from .models import (
    Role, Address, Organization, Location, Department,
    UserOrgProfile, Unit, UnitMembership, OnCallShift
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'label', 'city', 'state', 'zip_code')
    search_fields = ('label', 'city', 'state', 'zip_code')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'organization')
    search_fields = ('name',)
    list_filter = ('organization',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location')
    search_fields = ('name',)
    list_filter = ('location',)


@admin.register(UserOrgProfile)
class UserOrgProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'organisation', 'role', 'job_title')
    search_fields = ('user__username', 'job_title')
    list_filter = ('organisation', 'role')


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'department')
    search_fields = ('name',)
    list_filter = ('department',)


@admin.register(UnitMembership)
class UnitMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'unit', 'joined_at', 'is_admin')
    search_fields = ('user__user__username', 'unit__name')
    list_filter = ('unit', 'is_admin')


@admin.register(OnCallShift)
class OnCallShiftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'unit', 'start_time', 'end_time')
    search_fields = ('user__user__username', 'unit__name')
    list_filter = ('unit', 'user', 'start_time', 'end_time')
