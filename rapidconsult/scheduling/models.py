from django.conf import settings

# Create your models here.
from django.db import models


class Address(models.Model):
    address_1 = models.CharField(max_length=256, blank=True, null=True)
    address_2 = models.CharField(max_length=256, blank=True, null=True)
    city = models.CharField(max_length=256, blank=True, null=True)
    state = models.CharField(max_length=256, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    lat = models.FloatField(default=0.0, blank=True, null=True)
    lon = models.FloatField(default=0.0, blank=True, null=True)
    label = models.CharField(max_length=50, blank=True, null=True)


class Organization(models.Model):
    name = models.CharField(max_length=150, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, blank=True, null=True, related_name='organizations')
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    organization = models.ForeignKey(Organization, related_name="departments", on_delete=models.CASCADE)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.CASCADE, blank=True, null=True, related_name='departments')

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class Unit(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, related_name="units", on_delete=models.CASCADE)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.department.name})"


class Team(models.Model):
    name = models.CharField(max_length=100)
    unit = models.ForeignKey(Unit, related_name="teams", on_delete=models.CASCADE)
    display_picture = models.ImageField(upload_to="org_pics/", blank=True, null=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="TeamMembership",
        related_name="teams"
    )

    def __str__(self):
        return f"{self.name} ({self.unit.name})"


class TeamMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'team')

    def __str__(self):
        return f"{self.user.username} in {self.team.name} as {self.role.name if self.role else 'Member'}"


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class OnCallShift(models.Model):
    team = models.ForeignKey(Team, related_name="shifts", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='on_call_shifts'
    )
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="on_call_shifts")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} - {self.team.name} ({self.start_time} to {self.end_time})"
