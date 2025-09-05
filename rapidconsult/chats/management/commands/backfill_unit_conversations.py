import datetime

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from rapidconsult.scheduling.models import Unit
from rapidconsult.scheduling.models import UserOrgProfile

# Import your mongo helper
from rapidconsult.chats.api.mongo import create_group_chat
from rapidconsult.chats.mongo.models import Conversation


class Command(BaseCommand):
    help = "Backfill Conversations and UserConversations for all Units."

    def add_arguments(self, parser):
        parser.add_argument(
            "--organization-id",
            type=int,
            help="Limit to a specific organization ID",
        )
        parser.add_argument(
            "--created-by-id",
            type=str,
            required=True,
            help="SQL user ID (string) of the account to set as creator for all conversations",
        )

    def handle(self, *args, **options):
        org_id_filter = options.get("organization_id")
        created_by_id = options.get("created_by_id")

        if not created_by_id:
            raise CommandError("--created-by-id is required")

        qs = Unit.objects.all().prefetch_related("members", "department__location__organization")
        if org_id_filter:
            qs = qs.filter(department__location__organization_id=org_id_filter)

        created_count, skipped_count = 0, 0

        for unit in qs:
            if not unit.department or not unit.department.location:
                continue

            org_id = str(unit.department.location.organization_id)
            loc_id = str(unit.department.location_id)
            unit_id = str(unit.id)

            # Skip if already has a conversation
            existing = Conversation.objects(unitId=unit_id, type="group").first()
            if existing:
                skipped_count += 1
                continue

            # Collect unit members
            member_ids = [m.user.id or m.user.username for m in unit.members.select_related("user")]
            if not member_ids:
                continue

            member_names = [f"{m.user.name} - {m.user.id}" or m.user.username for m in
                            unit.members.select_related("user")]
            print(f"{unit.name} - Member names: {member_names}")

            try:
                create_group_chat(
                    created_by_id=created_by_id,
                    name=unit.name or f"Unit {unit.id}",
                    description=f"Group chat for unit {unit.name}" if unit.name else "Unit group chat",
                    member_ids=[str(mid) for mid in member_ids],
                    location_id=loc_id,
                    organization_id=org_id,
                    unit_id=unit_id,
                )
                created_count += 1
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"Failed for Unit {unit.id}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Backfill complete. Created {created_count} conversations, skipped {skipped_count}."
            )
        )
