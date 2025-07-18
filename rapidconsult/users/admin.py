from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import User


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
