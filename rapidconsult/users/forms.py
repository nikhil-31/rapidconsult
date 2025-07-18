from allauth.account.forms import SignupForm
from allauth.socialaccount.forms import SignupForm as SocialSignupForm
from django.contrib.auth import forms as admin_forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _

from .models import User


class UserAdminCreationForm(
    UserCreationForm):  # type: ignore[name-defined]  # django-stubs is missing the class, thats why the error is thrown: typeddjango/django-stubs#2555
    """
    Form for User Creation in the Admin Area.
    To change user signup, see UserSignupForm and UserSocialSignupForm.
    """

    class Meta(admin_forms.UserCreationForm.Meta):  # type: ignore[name-defined]
        model = User
        error_messages = {
            "username": {"unique": _("This username has already been taken.")},
        }


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("username", "email", "profile_picture")
        error_messages = {
            "username": {"unique": _("This username has already been taken.")},
        }


class CustomUserChangeForm(UserChangeForm):
    password = None  # optional: hide password field in admin

    class Meta:
        model = User
        fields = ('username', 'email', 'profile_picture', 'is_active', 'is_staff')

# class UserSignupForm(SignupForm):
#     """
#     Form that will be rendered on a user sign up section/screen.
#     Default fields will be added automatically.
#     Check UserSocialSignupForm for accounts created from social.
#     """
#
#
# class UserSocialSignupForm(SocialSignupForm):
#     """
#     Renders the form when user has signed up using social accounts.
#     Default fields will be added automatically.
#     See UserSignupForm otherwise.
#     """
