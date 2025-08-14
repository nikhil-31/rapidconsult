from django.contrib.auth import get_user_model
# app/serializers.py
from rest_framework import serializers

from rapidconsult.chats.models import Message, Conversation
from rapidconsult.users.api.serializers import UserSerializer
from rapidconsult.chats.mongo.models import UserConversation as MongoUserConversation

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


class UserConversationSerializer(serializers.Serializer):
    _id = serializers.CharField()
    userId = serializers.CharField()
    conversationId = serializers.CharField()
    conversationType = serializers.CharField()
    directMessage = serializers.DictField(required=False)
    groupChat = serializers.DictField(required=False)
    lastMessage = serializers.DictField(required=False)
    unreadCount = serializers.IntegerField()
    lastReadAt = serializers.DateTimeField(required=False)
    isPinned = serializers.BooleanField()
    isMuted = serializers.BooleanField()
    isArchived = serializers.BooleanField()
    customNotifications = serializers.DictField(required=False)
    draft = serializers.DictField(required=False)
    updatedAt = serializers.DateTimeField()
