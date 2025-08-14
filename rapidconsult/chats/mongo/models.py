from mongoengine import Document, StringField, DateTimeField, BooleanField, ListField, DictField, EmbeddedDocument, \
    EmbeddedDocumentField, IntField


# ---------------------------
# Users
# ---------------------------
class User(Document):
    sql_user_id = StringField(required=True, unique=True)
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    displayName = StringField()
    profile_picture = StringField()
    status = StringField(choices=["online", "offline", "away", "busy"])
    lastSeen = DateTimeField()
    createdAt = DateTimeField()
    updatedAt = DateTimeField()

    meta = {
        "collection": "users",
        "indexes": [
            {"fields": ["username"], "unique": True},
            {"fields": ["email"], "unique": True},
            "status"
        ]
    }


# ---------------------------
# Conversations
# ---------------------------
class Participant(EmbeddedDocument):
    userId = StringField(required=True)
    role = StringField(choices=["member", "admin", "owner"])
    joinedAt = DateTimeField()
    lastReadAt = DateTimeField()


class LastMessage(EmbeddedDocument):
    messageId = StringField()
    content = StringField()
    senderId = StringField()
    timestamp = DateTimeField()
    type = StringField()


class GroupSettings(EmbeddedDocument):
    isPublic = BooleanField(default=False)
    allowMemberInvite = BooleanField(default=True)
    maxMembers = IntField(default=100)


class Conversation(Document):
    type = StringField(choices=["direct", "group"], required=True)
    name = StringField()
    description = StringField()
    participants = ListField(EmbeddedDocumentField(Participant))
    lastMessage = EmbeddedDocumentField(LastMessage)
    isActive = BooleanField(default=True)
    createdBy = StringField()
    createdAt = DateTimeField()
    updatedAt = DateTimeField()
    directMessageParticipants = ListField(StringField())
    groupSettings = EmbeddedDocumentField(GroupSettings)

    meta = {
        "collection": "conversations",
        "indexes": [
            {"fields": ["type", "directMessageParticipants"]},
            {"fields": ["participants.userId"]},
            {"fields": ["isActive", "-updatedAt"]}
        ]
    }


# ---------------------------
# Messages
# ---------------------------
class Media(EmbeddedDocument):
    url = StringField()
    filename = StringField()
    size = IntField()
    mimeType = StringField()


class SystemMessage(EmbeddedDocument):
    action = StringField()
    targetUserId = StringField()


class ReadReceipt(EmbeddedDocument):
    userId = StringField()
    readAt = DateTimeField()


class Message(Document):
    conversationId = StringField(required=True)
    senderId = StringField(required=True)
    content = StringField()
    type = StringField(choices=["text", "image", "file", "system", "deleted"])
    timestamp = DateTimeField()
    media = EmbeddedDocumentField(Media)
    systemMessage = EmbeddedDocumentField(SystemMessage)
    isEdited = BooleanField(default=False)
    editedAt = DateTimeField()
    isDeleted = BooleanField(default=False)
    deletedAt = DateTimeField()
    replyTo = StringField()
    readBy = ListField(EmbeddedDocumentField(ReadReceipt))

    meta = {
        "collection": "messages",
        "indexes": [
            {"fields": ["conversationId", "-timestamp"]},
            {"fields": ["senderId", "-timestamp"]},
            {"fields": ["conversationId", "content", "type"]}
        ]
    }


# ---------------------------
# UserConversations
# ---------------------------
class UserConversation(Document):
    userId = StringField(required=True)
    conversationId = StringField(required=True)
    conversationType = StringField()
    otherParticipantId = StringField()
    otherParticipantName = StringField()
    otherParticipantAvatar = StringField()
    conversationName = StringField()
    lastMessage = DictField()
    unreadCount = IntField(default=0)
    lastReadAt = DateTimeField()
    isPinned = BooleanField(default=False)
    isMuted = BooleanField(default=False)
    isArchived = BooleanField(default=False)
    updatedAt = DateTimeField()

    meta = {
        "collection": "userConversations",
        "indexes": [
            {"fields": ["userId", "isArchived", "-updatedAt"]},
            {"fields": ["userId", "conversationId"], "unique": True}
        ]
    }
