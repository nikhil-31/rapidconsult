from django.utils import timezone
from .mongo.models import UserConversation, Message, LastMessageInfo


def update_user_conversation(msg: Message):
    now = timezone.now()

    # # Reset unread count for sender
    # UserConversation.objects(
    #     userId=sender_id,
    #     conversationId=conversation_id
    # ).update_one(
    #     set__unreadCount=0,
    #     set__updatedAt=now
    # )

    last_message_info = LastMessageInfo(
        messageId=str(msg.id),
        content=msg.content,
        senderId=msg.senderId,
        senderName=msg.senderName,
        timestamp=msg.timestamp,
        type=msg.type,
    )

    # Update all UserConversations tied to this conversation
    UserConversation.objects(conversationId=msg.conversationId).update(
        set__lastMessage=last_message_info,
        set__updatedAt=timezone.now()
    )

    # Increment unread count for all others
    UserConversation.objects(
        conversationId=msg.conversationId, userId__ne=msg.senderId
    ).update(inc__unreadCount=1, set__updatedAt=now)
