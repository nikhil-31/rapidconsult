from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from chats.mongo.models import User as MongoUser
from mongoengine import DoesNotExist

from rapidconsult.scheduling.models import UserOrgProfile
from .models import User


@receiver(post_save, sender=User)
def sync_user_to_mongo(sender, instance, created, **kwargs):
    try:
        mongo_user = MongoUser.objects.get(sql_user_id=str(instance.pk))
    except DoesNotExist:
        mongo_user = MongoUser(sql_user_id=str(instance.pk))

    mongo_user.username = instance.username
    mongo_user.email = instance.email
    mongo_user.displayName = instance.name
    mongo_user.avatar = instance.profile_picture.url if instance.profile_picture else None
    mongo_user.status = mongo_user.status or "offline"
    mongo_user.lastSeen = instance.last_login
    mongo_user.createdAt = getattr(instance, "date_joined", None)
    mongo_user.updatedAt = timezone.now()

    # Saving allowed locations into mongo
    allowed_location_ids = (
        UserOrgProfile.objects.filter(user=instance).values_list("allowed_locations__id", flat=True)
    )
    mongo_user.allowed_locations = [str(loc_id) for loc_id in allowed_location_ids if loc_id]

    mongo_user.save()


@receiver(post_delete, sender=User)
def delete_mongo_user(sender, instance, **kwargs):
    MongoUser.objects(sql_user_id=str(instance.pk)).delete()
