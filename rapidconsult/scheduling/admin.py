from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (
    Address, Organization, Department, Unit, Team, TeamMembership,
    Role, OnCallShift
)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('label', 'city', 'state', 'zip_code')
    search_fields = ('label', 'city', 'state', 'zip_code')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    list_select_related = ('address',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization')
    search_fields = ('name',)
    list_filter = ('organization',)
    list_select_related = ('organization', 'address')


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'department')
    search_fields = ('name',)
    list_filter = ('department',)
    list_select_related = ('department',)


class TeamMembershipInline(admin.TabularInline):
    model = TeamMembership
    extra = 1
    autocomplete_fields = ('user', 'role')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit')
    search_fields = ('name',)
    list_filter = ('unit',)
    list_select_related = ('unit',)
    inlines = [TeamMembershipInline]


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'is_admin', 'joined_at')
    search_fields = ('user__username', 'team__name')
    list_filter = ('is_admin', 'role')
    autocomplete_fields = ('user', 'team', 'role')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(OnCallShift)
class OnCallShiftAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'start_time', 'end_time')
    list_filter = ('team', 'role')
    search_fields = ('user__username', 'team__name')
    autocomplete_fields = ('user', 'team', 'role')
