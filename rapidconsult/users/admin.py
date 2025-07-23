from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import User, Contact


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    model = User
    list_display = ("email", "username", "is_staff", "is_active", "profile_picture")
    list_filter = ("is_staff", "is_active", "profile_picture")
    fieldsets = (
        (None, {"fields": ("username", "email", "password", "profile_picture")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "is_staff", "is_active", "profile_picture"),}
        ),
    )
    search_fields = ("email",)
    ordering = ("email",)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'label',
        'number',
        'country_code',
        'type',
        'verified',
        'primary',
    )
    list_filter = ('type', 'verified', 'primary')
    search_fields = ('user__username', 'label', 'number', 'country_code')
    autocomplete_fields = ('user',)
