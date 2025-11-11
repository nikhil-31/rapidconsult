import datetime

from asgiref.sync import async_to_sync
from bson import ObjectId
from channels.layers import get_channel_layer
from rest_framework.exceptions import ValidationError

from rapidconsult.chats.api.serializers import MongoMessageSerializer
from rapidconsult.chats.utils import update_user_conversation
from rapidconsult.chats.mongo.models import (
    Conversation, Participant, GroupSettings, DirectMessageInfo, GroupChatInfo, User
)
from rapidconsult.chats.mongo.models import UserConversation, Message as MongoMessage
from rapidconsult.scheduling.models import UserOrgProfile
from rapidconsult.scheduling.models import Consultation


def create_direct_message_conv(user1_id, user2_id, organization_id, location_id, system_message=True):
    existing_users = User.objects(sql_user_id__in=[str(user1_id), str(user2_id)]).only("sql_user_id")
    if existing_users.count() != 2:
        raise ValidationError({"detail": "One or more users do not exist."})

    existing = Conversation.objects(
        type="direct",
        directMessageParticipants__all=[user1_id, user2_id]
    ).first()
    if existing:
        return existing

    conv = Conversation(
        type="direct",
        participants=[
            Participant(userId=user1_id, role="member", joinedAt=datetime.datetime.utcnow()),
            Participant(userId=user2_id, role="member", joinedAt=datetime.datetime.utcnow())
        ],
        directMessageParticipants=[user1_id, user2_id],
        createdBy=user1_id,
        createdAt=datetime.datetime.utcnow(),
        updatedAt=datetime.datetime.utcnow(),
        organizationId=organization_id,
        locationId=location_id,
    ).save()

    for uid, other_id in [(user1_id, user2_id), (user2_id, user1_id)]:
        # Get the other participant's details from MongoDB
        other_user = User.objects(sql_user_id=other_id).first()
        if not other_user:
            raise ValidationError({"detail": "One or more users do not exist."})

        user_conv = UserConversation(
            _id=str(ObjectId()),
            userId=uid,
            conversationId=str(conv.id),
            conversationType="direct",
            directMessage=DirectMessageInfo(
                otherParticipantId=other_id,
                otherParticipantName=other_user.displayName,
                otherParticipantAvatar=other_user.profile_picture,
                otherParticipantStatus=other_user.status
            ),
            updatedAt=datetime.datetime.utcnow(),
            locationId=location_id,
            organizationId=organization_id,
        ).save()

        print(user_conv)

    return conv


def create_group_chat(created_by_id, name, description, member_ids, location_id, organization_id, unit_id):
    # Ensure creator is in members
    if created_by_id not in member_ids:
        member_ids.append(created_by_id)

    # Verify all members exist in Mongo
    existing_users = User.objects(sql_user_id__in=member_ids).only("sql_user_id", "displayName")
    if existing_users.count() != len(set(member_ids)):
        raise ValidationError({"detail": "One or more members do not exist."})

    conv = Conversation(
        type="group",
        name=name,
        description=description,
        participants=[
            Participant(
                userId=uid.sql_user_id,
                name=uid.displayName,
                role="owner" if uid == created_by_id else "member",
                joinedAt=datetime.datetime.utcnow()
            )
            for uid in existing_users
        ],
        groupSettings=GroupSettings(isPublic=False, allowMemberInvite=True, maxMembers=200),
        createdBy=created_by_id,
        createdAt=datetime.datetime.utcnow(),
        updatedAt=datetime.datetime.utcnow(),
        organizationId=organization_id,
        locationId=location_id,
        unitId=unit_id,
    ).save()

    for uid in member_ids:
        role = "owner" if uid == created_by_id else "member"
        UserConversation(
            _id=str(ObjectId()),
            userId=uid,
            conversationId=str(conv.id),
            conversationType="group",
            groupChat=GroupChatInfo(
                name=name,
                description=description,
                memberCount=len(member_ids),
                adminIds=[created_by_id],
                myRole=role
            ),
            updatedAt=datetime.datetime.utcnow(),
            locationId=location_id,
            organizationId=organization_id,
            unitId=unit_id,
        ).save()

    return conv


def add_user_to_group_chat(unit_id: str, user_id: str, is_admin: bool = False):
    """Add a participant to the unit's group chat conversation."""
    conversation = Conversation.objects(unitId=str(unit_id), type="group").first()
    if not conversation:
        return None

    # Check if already a participant
    if any(p.userId == user_id for p in conversation.participants):
        return conversation

    # Check if the user is a legitimate user
    user = User.objects(sql_user_id=user_id).first()
    if not user:
        raise ValidationError({"detail": "User does not exist."})

    name = user.displayName
    role = "admin" if is_admin else "member"

    participant = Participant(
        userId=user_id,
        name=name,
        role=role,
        joinedAt=datetime.datetime.utcnow()
    )
    conversation.participants.append(participant)
    conversation.updatedAt = datetime.datetime.utcnow()
    conversation.save()

    # Also add UserConversation record
    UserConversation(
        _id=str(ObjectId()),
        userId=user_id,
        conversationId=str(conversation.id),
        conversationType="group",
        groupChat=dict(
            name=conversation.name,
            description=conversation.description,
            memberCount=len(conversation.participants),
            adminIds=[conversation.createdBy],
            myRole="member",
        ),
        updatedAt=datetime.datetime.utcnow(),
        locationId=conversation.locationId,
        organizationId=conversation.organizationId,
        unitId=conversation.unitId,
    ).save()

    return conversation


def remove_user_from_group_chat(unit_id: str, user_id: str):
    """Remove a participant from the unit's group chat conversation."""
    conversation = Conversation.objects(unitId=str(unit_id), type="group").first()
    if not conversation:
        return None

    print(user_id)

    if not User.objects(sql_user_id=user_id).only("sql_user_id").first():
        raise ValidationError({"detail": "User does not exist."})

    before_count = len(conversation.participants)
    conversation.participants = [p for p in conversation.participants if p.userId != user_id]
    after_count = len(conversation.participants)

    if before_count != after_count:
        conversation.updatedAt = datetime.datetime.utcnow()
        conversation.save()

    # Remove their UserConversation record
    UserConversation.objects(userId=user_id, conversationId=str(conversation.id)).delete()

    return conversation


def handle_consult_update_system_message(consult: Consultation):
    user_1_name = consult.referred_by_doctor.user.name

    user_1_id = consult.referred_by_doctor.user.id
    user_2_id = consult.referred_to_doctor.user.id

    organization_id = consult.organization.id
    location_id = consult.location.id

    patient_name = consult.patient_name
    patient_age = consult.patient_age
    patient_sex = consult.patient_sex
    ward = consult.ward
    urgency = consult.urgency
    diagnosis = consult.diagnosis
    reason_for_referral = consult.reason_for_referral
    status = consult.status

    consultant_remarks = consult.consultant_remarks
    consultant_review = consult.consultant_review

    if status in ["pending", "in_progress"]:

        message = (
            f"Patient Name: {patient_name}\n"
            f"Age: {patient_age}\n"
            f"Sex: {patient_sex}\n"
            f"Ward: {ward}\n"
            f"Urgency: {urgency}\n"
            f"Diagnosis: {diagnosis}\n"
            f"Reason for Referral: {reason_for_referral}\n"
            f"Status: {status}\n"
        )
    elif status in ["completed", "closed"]:
        message = (
            f"Patient Name: {patient_name}\n"
            f"Age: {patient_age}\n"
            f"Sex: {patient_sex}\n"
            f"Ward: {ward}\n"
            f"Urgency: {urgency}\n"
            f"Diagnosis: {diagnosis}\n"
            f"Reason for Referral: {reason_for_referral}\n"
            f"Status: {status}\n"
            f"Consultant Remarks: {consultant_remarks}\n"
            f"Consultant Review: {consultant_review}\n"
        )

    msg = create_system_message(
        str(user_1_id),
        str(user_2_id),
        str(organization_id),
        str(location_id),
        str(user_1_name),
        message,
    )


def create_system_message(user1_id: str, user2_id: str, organization_id: str, location_id: str,
                          user1_name: str, content: str):
    ## Step 1 - Create DM conversations
    conv = create_direct_message_conv(user1_id, user2_id, organization_id=organization_id, location_id=location_id)
    conversation_id = conv.id

    ## Step 2 - Send a system message
    msg = MongoMessage.objects.create(
        conversationId=str(conversation_id),
        senderId=str(user1_id),
        senderName=str(user1_name),
        content=content,
        type="consult",
        timestamp=datetime.datetime.utcnow(),
        locationId=str(location_id),
        organizationId=str(organization_id),
    )

    # Update user conversation
    update_user_conversation(msg)

    # Broadcast over WebSocket
    channel_layer = get_channel_layer()
    # Broadcast to group
    async_to_sync(channel_layer.group_send)(
        str(conversation_id),
        {
            "type": "chat_message_echo",
            "message": MongoMessageSerializer(msg).data,
        }
    )

    return msg
