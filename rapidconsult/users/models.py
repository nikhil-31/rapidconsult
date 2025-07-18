from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import CharField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Default custom user model for rapidconsult.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    # First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore[assignment]
    last_name = None  # type: ignore[assignment]
    profile_picture = models.ImageField(upload_to="profile_pics/", blank=True, null=True)

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"username": self.username})

    def __str__(self):
        return str(self.username or self.email or f"User {self.pk}")


# class PhoneNumber(models.Model):
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='phone_numbers'
#     )
#     number = models.CharField(max_length=20, blank=True, null=True)
#     country_code = models.CharField(max_length=6, blank=True, help_text="e.g. +91", null=True)
#     label = models.CharField(max_length=50, blank=True, null=True)
#     verified = models.BooleanField(default=False, blank=True, null=True)
#     primary = models.BooleanField(default=False, blank=True, null=True)
#
#     def save(self, *args, **kwargs):
#         # Ensure only one primary number per user
#         if self.primary:
#             PhoneNumber.objects.filter(user=self.user, primary=True).update(primary=False)
#         super().save(*args, **kwargs)
#
#     def __str__(self):
#         prefix = f"{self.country_code} " if self.country_code else ""
#         return f"{self.label or 'Phone'}: {prefix}{self.number}"
#
#
# class Address(models.Model):
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='phone_numbers'
#     )
#     address_1 = models.CharField(max_length=256, blank=True, null=True)
#     address_2 = models.CharField(max_length=256, blank=True, null=True)
#     city = models.CharField(max_length=256, blank=True, null=True)
#     state = models.CharField(max_length=256, blank=True, null=True)
#     zip_code = models.CharField(max_length=20, blank=True, null=True)
#     lat = models.FloatField(default=0.0, blank=True, null=True)
#     lon = models.FloatField(default=0.0, blank=True, null=True)
