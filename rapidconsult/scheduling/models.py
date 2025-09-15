from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
# Create your models here.
from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.name}"


class Address(models.Model):
    address_1 = models.CharField(max_length=256, blank=True, null=True)
    address_2 = models.CharField(max_length=256, blank=True, null=True)
    city = models.CharField(max_length=256, blank=True, null=True)
    state = models.CharField(max_length=256, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    lat = models.FloatField(default=0.0, blank=True, null=True)
    lon = models.FloatField(default=0.0, blank=True, null=True)
    label = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.label} - {self.address_1}"


class Organization(models.Model):
    name = models.CharField(max_length=150, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, blank=True, null=True, related_name='organizations')
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)

    def __str__(self):
        return f"{self.name}"


class Location(models.Model):
    name = models.CharField(max_length=150, blank=True, null=True)
    organization = models.ForeignKey(Organization, related_name="locations", on_delete=models.SET_NULL, blank=True,
                                     null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, blank=True, null=True)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class Department(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, related_name="departments", blank=True, null=True)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.location.name})"


class UserOrgProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
                             related_name='org_profiles')
    organization = models.ForeignKey(Organization, blank=True, null=True, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="org_roles", null=True, blank=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    allowed_locations = models.ManyToManyField(Location, related_name='permitted_users', blank=True)

    def __str__(self):
        return str(self.user)

    def clean(self):
        if not self.pk:
            return

        for location in self.allowed_locations.all():
            if location.organization_id != self.organization_id:
                raise ValidationError(
                    f"Location '{location.name}' does not belong to the same organization as the user."
                )


class Unit(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    department = models.ForeignKey(Department, related_name="units", on_delete=models.CASCADE, blank=True, null=True)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)
    members = models.ManyToManyField(
        UserOrgProfile,
        through="UnitMembership",
        related_name="members"
    )

    def __str__(self):
        return f"{self.name} ({self.department.name})"

    def get_current_oncall_shifts(self):
        now = timezone.now()
        return (
            self.shifts.filter(start_time__lte=now, end_time__gte=now).select_related("user", "user__user")
        )


class UnitMembership(models.Model):
    user = models.ForeignKey(UserOrgProfile, on_delete=models.CASCADE, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    is_admin = models.BooleanField(default=False, null=True, blank=True)

    class Meta:
        unique_together = ('user', 'unit')

    def __str__(self):
        return f"{self.user} in {self.unit.name}"


class OnCallShift(models.Model):
    SHIFT_TYPE_CHOICES = [
        ('oncall', 'On-Call'),
        ('outpatient', 'Out-Patient'),
    ]

    user = models.ForeignKey(UserOrgProfile, on_delete=models.CASCADE, related_name='on_call_shifts', null=True,
                             blank=True)
    unit = models.ForeignKey(Unit, related_name="shifts", on_delete=models.CASCADE, null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    shift_type = models.CharField(
        max_length=20,
        choices=SHIFT_TYPE_CHOICES,
        default='oncall',
        help_text="Type of shift: oncall or outpatient",
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user} - {self.unit.name} ({self.start_time} to {self.end_time})"
