from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class UserDevice(models.Model):
    DEVICE_TYPE_CHOICES = (
        ('fcm', 'FCM'),
        ('apns', 'APNS'),
        ('web', 'Web'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices', blank=True, null=True)
    registration_id = models.CharField(_("Registration ID"), max_length=255, unique=True, blank=True, null=True)
    type = models.CharField(_("Type"), max_length=10, choices=DEVICE_TYPE_CHOICES, default='fcm', blank=True, null=True)
    active = models.BooleanField(_("Active"), default=True, blank=True, null=True)
    device_type = models.CharField(_("Device Type"), max_length=20, default=None, blank=True, null=True)
    date_created = models.DateTimeField(_("Date Created"), auto_now_add=True, blank=True, null=True)
    last_updated = models.DateTimeField(_("Last Updated"), auto_now=True, blank=True, null=True)

    class Meta:
        verbose_name = _("User Device")
        verbose_name_plural = _("User Devices")

    def __str__(self):
        return f"{self.user} - {self.type} - {self.registration_id[:10]}..."
