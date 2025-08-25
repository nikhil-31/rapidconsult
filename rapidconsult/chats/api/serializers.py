from django.contrib.auth import get_user_model
from rest_framework import serializers

from rapidconsult.chats.models import Message, Conversation
from rapidconsult.users.api.serializers import UserSerializer

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    from_user = serializers.SerializerMethodField()
    to_user = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "conversation",
            "from_user",
            "to_user",
            "content",
            "timestamp",
            "read",
            "file",
        )

    def get_conversation(self, obj):
        return str(obj.conversation.id)

    def get_from_user(self, obj):
        return UserSerializer(obj.from_user).data

    def get_to_user(self, obj):
        return UserSerializer(obj.to_user).data

    def get_file(self, obj):
        if obj.file:
            try:
                return obj.file.url
            except ValueError:
                return None
        return None


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "name", "other_user", "last_message")

    def get_last_message(self, obj):
        messages = obj.messages.all().order_by("-timestamp")
        if not messages.exists():
            return None
        message = messages[0]
        return MessageSerializer(message).data

    def get_other_user(self, obj):
        usernames = obj.name.split("__")
        context = {}
        for username in usernames:
            if username != self.context["user"].username:
                # This is the other participant
                other_user = User.objects.get(username=username)
                return UserSerializer(other_user, context=context).data
        return None


class DirectMessageInfoSerializer(serializers.Serializer):
    otherParticipantId = serializers.CharField()
    otherParticipantName = serializers.CharField()
    otherParticipantAvatar = serializers.URLField()
    otherParticipantStatus = serializers.CharField()


class GroupChatInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField()
    avatar = serializers.URLField()
    memberCount = serializers.IntegerField()
    adminIds = serializers.ListField(child=serializers.CharField())
    myRole = serializers.CharField()


class LastMessageInfoSerializer(serializers.Serializer):
    messageId = serializers.CharField()
    content = serializers.CharField()
    senderId = serializers.CharField()
    senderName = serializers.CharField()
    timestamp = serializers.DateTimeField()
    type = serializers.CharField()


class CustomNotificationSettingsSerializer(serializers.Serializer):
    sound = serializers.CharField()
    vibrate = serializers.BooleanField()
    priority = serializers.CharField()


class DraftInfoSerializer(serializers.Serializer):
    content = serializers.CharField()
    timestamp = serializers.DateTimeField()


# User conversation serialization
class UserConversationSerializer(serializers.Serializer):
    _id = serializers.CharField()
    userId = serializers.CharField()
    conversationId = serializers.CharField()
    conversationType = serializers.CharField()
    directMessage = DirectMessageInfoSerializer(required=False)
    groupChat = GroupChatInfoSerializer(required=False)
    lastMessage = LastMessageInfoSerializer(required=False)
    unreadCount = serializers.IntegerField()
    lastReadAt = serializers.DateTimeField(required=False)
    isPinned = serializers.BooleanField()
    isMuted = serializers.BooleanField()
    isArchived = serializers.BooleanField()
    customNotifications = CustomNotificationSettingsSerializer(required=False)
    draft = DraftInfoSerializer(required=False)
    updatedAt = serializers.DateTimeField()


class DirectMessageSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["direct"])
    user1_id = serializers.CharField()
    user2_id = serializers.CharField()


class GroupChatSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["group"])
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    member_ids = serializers.ListField(child=serializers.CharField(), min_length=2)


# Message serialization
class MediaSerializer(serializers.Serializer):
    url = serializers.CharField(required=False, allow_blank=True)
    filename = serializers.CharField(required=False, allow_blank=True)
    size = serializers.IntegerField(required=False)
    mimeType = serializers.CharField(required=False, allow_blank=True)


class SystemMessageSerializer(serializers.Serializer):
    action = serializers.CharField(required=False, allow_blank=True)
    targetUserId = serializers.CharField(required=False, allow_blank=True)


class ReadReceiptSerializer(serializers.Serializer):
    userId = serializers.CharField()
    readAt = serializers.DateTimeField()


class MongoMessageSerializer(serializers.Serializer):
    id = serializers.CharField()
    conversationId = serializers.CharField()
    senderName = serializers.CharField()
    senderId = serializers.CharField()
    content = serializers.CharField(required=False, allow_blank=True)
    type = serializers.CharField()
    timestamp = serializers.DateTimeField()
    media = MediaSerializer(required=False)
    systemMessage = SystemMessageSerializer(required=False)
    isEdited = serializers.BooleanField(default=False)
    editedAt = serializers.DateTimeField(required=False)
    isDeleted = serializers.BooleanField(default=False)
    deletedAt = serializers.DateTimeField(required=False)
    readBy = ReadReceiptSerializer(many=True, required=False)
    locationId = serializers.CharField(required=False, allow_blank=True)
    organizationId = serializers.CharField(required=False, allow_blank=True)
    replyTo = serializers.SerializerMethodField()

    @staticmethod
    def get_replyTo(obj):
        """Return a nested serialized message or just None/ID."""
        if obj.replyTo:
            try:
                return {
                    "id": str(obj.replyTo.id),
                    "conversationId": obj.replyTo.conversationId,
                    "senderId": obj.replyTo.senderId,
                    "senderName": obj.replyTo.senderName,
                    "content": obj.replyTo.content,
                    "type": obj.replyTo.type,
                    "timestamp": obj.replyTo.timestamp.isoformat() if obj.replyTo.timestamp else None,
                    "media": {
                        "url": obj.media.url,
                        "filename": obj.media.filename,
                        "size": obj.media.size,
                        "mimeType": obj.media.mimeType,
                    } if obj.media else None,
                }
            except Exception:
                return str(obj.replyTo)  # fallback to ID if not a full object
        return None
