import datetime

from bson import ObjectId
from rest_framework.exceptions import ValidationError
from rapidconsult.chats.mongo.models import (
    Conversation, Participant, GroupSettings, UserConversation,
    DirectMessageInfo, GroupChatInfo, User
)


def create_direct_message(user1_id, user2_id):
    existing_users = User.objects(sql_user_id__in=[user1_id, user2_id]).only("sql_user_id")
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
        updatedAt=datetime.datetime.utcnow()
    ).save()

    for uid, other_id in [(user1_id, user2_id), (user2_id, user1_id)]:
        # Get the other participant's details from MongoDB
        other_user = User.objects(sql_user_id=other_id).first()
        if not other_user:
            raise ValidationError({"detail": "One or more users do not exist."})

        UserConversation(
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
            updatedAt=datetime.datetime.utcnow()
        ).save()

    return conv


def create_group_chat(created_by_id, name, description, member_ids):
    # ✅ Ensure creator is in members
    if created_by_id not in member_ids:
        member_ids.append(created_by_id)

    # ✅ Verify all members exist in Mongo
    existing_users = User.objects(sql_user_id__in=member_ids).only("sql_user_id")
    if existing_users.count() != len(set(member_ids)):
        raise ValidationError({"detail": "One or more members do not exist."})


    conv = Conversation(
        type="group",
        name=name,
        description=description,
        participants=[
            Participant(userId=uid, role="owner" if uid == created_by_id else "member",
                        joinedAt=datetime.datetime.utcnow())
            for uid in member_ids
        ],
        groupSettings=GroupSettings(isPublic=False, allowMemberInvite=True, maxMembers=200),
        createdBy=created_by_id,
        createdAt=datetime.datetime.utcnow(),
        updatedAt=datetime.datetime.utcnow()
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
            updatedAt=datetime.datetime.utcnow()
        ).save()

    return conv
