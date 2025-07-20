from django.contrib.auth.models import AbstractUser
from django.conf import settings
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
    job_title = models.CharField(max_length=255, blank=True, null=True)

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"username": self.username})

    def __str__(self):
        return str(self.username or self.email or f"User {self.pk}")


class Contact(models.Model):
    CONTACT_TYPE_CHOICES = [
        ('mobile', 'Mobile'),
        ('home', 'Home'),
        ('work', 'Work'),
        ('fax', 'Fax'),
        ('other', 'Other'),
        ('email', 'Email'),
        ('on_call', 'On Call'),
        ('clinic', 'Clinic'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='phone_numbers'
    )
    number = models.CharField(max_length=200, blank=True, null=True)
    country_code = models.CharField(max_length=6, blank=True, help_text="e.g. +91", null=True)
    label = models.CharField(max_length=50, blank=True, null=True)
    verified = models.BooleanField(default=False, blank=True, null=True)
    primary = models.BooleanField(default=False, blank=True, null=True)
    type = models.CharField(
        max_length=50,
        choices=CONTACT_TYPE_CHOICES,
        default='mobile',
        blank=True,
        null=True
    )

    def save(self, *args, **kwargs):
        # Ensure only one primary number per user
        if self.primary:
            Contact.objects.filter(user=self.user, primary=True).update(primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        prefix = f"{self.country_code} " if self.country_code else ""
        return f"{self.label or 'Phone'}: {prefix}{self.number}"

#
#
# class Office(models.Model):
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='offices'
#     )
#     office_address = models.ForeignKey(Address, on_delete=models.CASCADE, blank=True, null=True)
