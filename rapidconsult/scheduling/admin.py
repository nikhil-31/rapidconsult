from django.contrib import admin
from .models import (
    Role, Address, Organization, Location, Department,
    UserOrgProfile, Unit, UnitMembership, OnCallShift
)
from django.core.exceptions import ValidationError
from django.forms import ModelForm
from django import forms


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


class UserOrgProfileForm(forms.ModelForm):
    class Meta:
        model = UserOrgProfile
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If editing an existing instance with an organization set
        if self.instance and self.instance.organization:
            self.fields["allowed_locations"].queryset = Location.objects.filter(
                organization=self.instance.organization
            )
        else:
            # New instance without an organization yet → empty queryset
            self.fields["allowed_locations"].queryset = Location.objects.none()

    def clean(self):
        cleaned_data = super().clean()
        organization = cleaned_data.get("organization")
        allowed_locations = cleaned_data.get("allowed_locations")

        if organization and allowed_locations:
            # Find any invalid locations in one query
            invalid_locations = allowed_locations.exclude(organization=organization)

            if invalid_locations.exists():
                self.add_error(
                    "allowed_locations",
                    ValidationError(
                        f"Invalid locations: {', '.join(invalid_locations.values_list('name', flat=True))} "
                        f"do not belong to organization '{organization.name}'."
                    )
                )

        return cleaned_data


@admin.register(UserOrgProfile)
class UserOrgProfileAdmin(admin.ModelAdmin):
    form = UserOrgProfileForm
    list_display = ['user', 'organization', 'role', 'job_title']
    list_filter = ['organization', 'role']
    search_fields = ['user__username', 'job_title']
    filter_horizontal = ['allowed_locations']  # Enables a better UI for selecting many-to-many fields


class UnitMembershipInline(admin.TabularInline):
    model = UnitMembership
    extra = 1
    autocomplete_fields = ['user']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    inlines = [UnitMembershipInline]
    list_display = ('id', 'name', 'department', "get_members")
    search_fields = ('name',)
    list_filter = ('department',)

    def get_members(self, obj):
        return ", ".join([str(user) for user in obj.members.all()])

    get_members.short_description = "Members"


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
