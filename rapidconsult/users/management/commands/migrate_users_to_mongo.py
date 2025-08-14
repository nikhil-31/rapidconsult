from django.core.management.base import BaseCommand
from django.utils import timezone

from rapidconsult.chats.mongo.models import User as MongoUser
from rapidconsult.users.models import User


class Command(BaseCommand):
    help = "Migrate all SQL users into MongoDB users collection."

    def handle(self, *args, **options):
        total = 0
        skipped = 0

        for sql_user in User.objects.all():
            if MongoUser.objects(sql_user_id=str(sql_user.pk)).first():
                self.stdout.write(self.style.WARNING(
                    f"Skipping {sql_user.username} (already exists in Mongo)"
                ))
                skipped += 1
                continue

            mongo_user = MongoUser(
                sql_user_id=str(sql_user.pk),
                username=sql_user.username,
                email=sql_user.email,
                displayName=sql_user.name,
                profile_picture=sql_user.profile_picture.url if sql_user.profile_picture else None,
                status="offline",  # default value
                lastSeen=timezone.now(),
                createdAt=sql_user.date_joined or timezone.now(),
                updatedAt=sql_user.last_login or timezone.now()
            )
            mongo_user.save()
            self.stdout.write(self.style.SUCCESS(
                f"Migrated {sql_user.username} → Mongo"
            ))
            total += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Migration complete: {total} migrated, {skipped} skipped."
        ))
