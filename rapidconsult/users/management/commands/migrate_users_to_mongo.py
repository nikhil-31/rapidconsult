from django.core.management.base import BaseCommand
from django.utils import timezone

from rapidconsult.chats.mongo.models import User as MongoUser
from rapidconsult.users.models import User
from scheduling.models import UserOrgProfile


class Command(BaseCommand):
    help = "Migrate all SQL users into MongoDB users collection."

    def handle(self, *args, **options):
        total_created = 0
        total_updated = 0

        for sql_user in User.objects.all():
            # Saving allowed locations into mongo
            allowed_location_ids = (
                UserOrgProfile.objects.filter(user=sql_user).values_list("allowed_locations__id", flat=True)
            )
            allowed_locations = [str(loc_id) for loc_id in allowed_location_ids if loc_id]

            mongo_user = MongoUser.objects(sql_user_id=str(sql_user.pk)).first()
            if mongo_user:
                mongo_user.username = sql_user.username
                mongo_user.email = sql_user.email
                mongo_user.displayName = sql_user.name
                mongo_user.profile_picture = sql_user.profile_picture.url if sql_user.profile_picture else None
                mongo_user.status = mongo_user.status or "offline"
                mongo_user.lastSeen = sql_user.last_login or mongo_user.lastSeen
                mongo_user.createdAt = sql_user.date_joined or mongo_user.createdAt
                mongo_user.updatedAt = timezone.now()
                mongo_user.allowed_locations = allowed_locations
                mongo_user.save()

                self.stdout.write(self.style.WARNING(
                    f"Updated {sql_user.username} → Mongo"
                ))
                total_updated += 1
            else:
                mongo_user = MongoUser(
                    sql_user_id=str(sql_user.pk),
                    username=sql_user.username,
                    email=sql_user.email,
                    displayName=sql_user.name,
                    profile_picture=sql_user.profile_picture.url if sql_user.profile_picture else None,
                    status="offline",  # default value
                    lastSeen=timezone.now(),
                    createdAt=sql_user.date_joined or timezone.now(),
                    updatedAt=sql_user.last_login or timezone.now(),
                    allowed_locations=allowed_locations,
                )
                mongo_user.save()

                self.stdout.write(self.style.SUCCESS(
                    f"Created {sql_user.username} → Mongo"
                ))
                total_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Migration complete: {total_created} migrated, {total_updated} updated."
        ))
