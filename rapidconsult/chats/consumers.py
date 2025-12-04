import json
from uuid import UUID

from django.utils import timezone
from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync

from rapidconsult.chats.api.serializers import MongoMessageSerializer
from rapidconsult.chats.presence import is_online, mark_online, mark_offline, heartbeat, get_last_seen
from rapidconsult.chats.utils import update_user_conversation
from rapidconsult.chats.models import Conversation, Message, User
from rapidconsult.chats.api.serializers import MessageSerializer
from rapidconsult.chats.mongo.models import Conversation as MongoConversation, Message as MongoMessage, \
    User as MongoUser, LastMessageInfo, UserConversation
from mongoengine.queryset.visitor import Q


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return obj.hex
        return json.JSONEncoder.default(self, obj)


class ChatConsumer(JsonWebsocketConsumer):
    def __init__(self):
        super().__init__()
        self.user = None
        self.conversation_name = None
        self.conversation = None

    def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return

        self.accept()
        self.conversation_name = self.scope['url_route']['kwargs']['conversation_name']
        self.conversation, _ = Conversation.objects.get_or_create(name=self.conversation_name)

        async_to_sync(self.channel_layer.group_add)(
            self.conversation_name,
            self.channel_name,
        )

        # Send last 50 messages
        messages = self.conversation.messages.all().order_by("-timestamp")[:50]
        message_count = self.conversation.messages.count()

        self.send_json({
            "type": "last_50_messages",
            "messages": MessageSerializer(messages, many=True).data,
            "message_count": message_count,
            "has_more": message_count > 50,
        })

        self.send_json({
            "type": "online_user_list",
            "users": [user.username for user in self.conversation.online.all()],
        })

        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                "type": "user_join",
                "user": self.user.username,
            },
        )

        self.conversation.online.add(self.user)

        # Initial unread count
        unread_count = Message.objects.filter(to_user=self.user, read=False).count()
        self.send_json({
            "type": "unread_count",
            "unread_count": unread_count,
        })

    def disconnect(self, code):
        print("Disconnected!")
        if self.user.is_authenticated:
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    "type": "user_leave",
                    "user": self.user.username,
                },
            )
            self.conversation.online.remove(self.user)

        return super().disconnect(code)

    def receive_json(self, content, **kwargs):
        message_type = content["type"]

        if message_type == "chat_message":
            message = Message.objects.create(
                from_user=self.user,
                to_user=self.get_message_receiver(),
                content=content.get("message", ""),
                conversation=self.conversation
            )

            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    "type": "chat_message_echo",
                    "name": content.get("name", ""),
                    "message": MessageSerializer(message).data,
                },
            )

        elif message_type == "typing":
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    "type": "typing",
                    "user": self.user.username,
                    "typing": content["typing"],
                },
            )

        elif message_type == "read_messages":
            # Mark all messages sent *to me* as read
            messages_to_me = self.conversation.messages.filter(to_user=self.user, read=False)

            for msg in messages_to_me:
                async_to_sync(self.channel_layer.group_send)(
                    self.conversation_name,
                    {
                        "type": "message_read",
                        "message_id": str(msg.id),
                    }
                )

            # Update unread count for user
            unread_count = Message.objects.filter(to_user=self.user, read=False).count()
            async_to_sync(self.channel_layer.group_send)(
                self.user.username + "__notifications",
                {
                    "type": "unread_count",
                    "unread_count": unread_count,
                },
            )
            messages_to_me.update(read=True)

        elif message_type == "ping":
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    "type": "pong"
                },
            )

        return super().receive_json(content, **kwargs)

    def get_message_receiver(self):
        usernames = self.conversation_name.split("__")
        for username in usernames:
            if username != self.user.username:
                # This is the receiver
                return User.objects.get(username=username)
        return User.objects.get_or_create(username="test")

    def chat_message_echo(self, event):
        self.send_json(event)

    def typing(self, event):
        self.send_json(event)

    def user_join(self, event):
        self.send_json(event)

    def user_leave(self, event):
        self.send_json(event)

    def unread_count(self, event):
        self.send_json(event)

    def pong(self, event):
        self.send_json(event)

    def message_read(self, event):
        self.send_json(event)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=UUIDEncoder)


class NotificationConsumer(JsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.user = None
        self.notification_group_name = None

    def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return
        self.accept()

        self.notification_group_name = self.user.username + "__notifications"
        async_to_sync(self.channel_layer.group_add)(
            self.notification_group_name,
            self.channel_name,
        )

        # Add to presence updates group
        async_to_sync(self.channel_layer.group_add)(
            "presence_updates",
            self.channel_name,
        )

        # Mark online in Redis
        mark_online(self.user.id)

        # Broadcast ONLINE event
        async_to_sync(self.channel_layer.group_send)(
            "presence_updates",
            {
                "type": "user_status",
                "user_id": str(self.user.id),
                "status": "online",
            },
        )

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.notification_group_name,
            self.channel_name,
        )

        # Mark offline in Redis
        mark_offline(self.user.id)

        # Broadcast OFFLINE event
        async_to_sync(self.channel_layer.group_send)(
            "presence_updates",
            {
                "type": "user_status",
                "user_id": str(self.user.id),
                "status": "offline",
            },
        )
        return super().disconnect(code)

    def receive_json(self, content, **kwargs):
        """
        Handle incoming messages from the frontend.
        Mainly used for heartbeats (ping).
        """
        msg_type = content.get("type")

        if msg_type == "heartbeat":
            heartbeat(self.user.id)
            # self.send_json({"type": "pong"})  # optional ack

        return super().receive_json(content, **kwargs)

    def new_message_notification(self, event):
        self.send_json(event)

    def unread_count(self, event):
        self.send_json(event)

    def user_status(self, event):
        self.send_json(event)


class VoxChatConsumer(JsonWebsocketConsumer):

    def __init__(self):
        super().__init__()
        self.user = None
        self.conversation_id = None
        self.conversation = None

    def send_last_50_messages(self):
        last_msgs = MongoMessage.objects(conversationId=self.conversation_id).order_by("-timestamp")[:50]
        total_count = MongoMessage.objects(conversationId=self.conversation_id).count()
        has_more = total_count > 50
        serialized = [MongoMessageSerializer(msg).data for msg in reversed(last_msgs)]

        self.send_json({
            "type": "last_50_messages",
            "messages": serialized,
            "message_count": len(serialized),
            "has_more": has_more,
        })

    def handle_presence(self):
        participants = self.conversation.participants
        other = next((p for p in participants if str(p.userId) != str(self.user.id)), None)
        if other:
            self.other_user_id = str(other.userId)

            # Immediately inform frontend about other participant's status
            self.send_json({
                "type": "presence",
                "user_id": self.other_user_id,
                "status": "online" if is_online(self.other_user_id) else "offline",
                "last_seen": get_last_seen(self.other_user_id),
            })

            # Listen for presence updates
            async_to_sync(self.channel_layer.group_add)(
                "presence_updates",
                self.channel_name,
            )

        # Subscribe to presence updates
        async_to_sync(self.channel_layer.group_add)("presence_updates", self.channel_name)

    def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return

        self.accept()

        # Getting the conversation name using URL route
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation = MongoConversation.objects.get(id=self.conversation_id)

        async_to_sync(self.channel_layer.group_add)(
            self.conversation_id,
            self.channel_name,
        )

        # Sending last 50 messages
        self.send_last_50_messages()

        # Handle online/offline and last_seen
        self.handle_presence()

    def disconnect(self, code):
        print("Disconnected!")
        if self.user.is_authenticated:
            async_to_sync(self.channel_layer.group_discard)(
                self.conversation_id,
                self.channel_name,
            )
            async_to_sync(self.channel_layer.group_discard)(
                "presence_updates",
                self.channel_name,
            )
        return super().disconnect(code)

    def save_message(self, content):
        if content.get("replyTo") is not None:
            replied_to_message = MongoMessage.objects.get(conversationId=self.conversation_id,
                                                          id=content["replyTo"])
        else:
            replied_to_message = None

        msg = MongoMessage(
            conversationId=content["conversationId"],
            senderId=str(self.user.id),
            senderName=str(self.user.name),
            content=content.get("content"),
            type=content.get("messageType", "text"),
            timestamp=timezone.now(),
            replyTo=replied_to_message,
            locationId=str(content.get("locationId")),
            organizationId=str(content.get("organizationId")),
        )
        msg.save()

        # Update user conversation
        update_user_conversation(msg)

        # Broadcast to group
        async_to_sync(self.channel_layer.group_send)(
            self.conversation_id,
            {
                "type": "chat_message_echo",
                "message": MongoMessageSerializer(msg).data,
            }
        )

        # Send push notification
        from rapidconsult.notifications.services import send_notification
        participants = self.conversation.participants
        for participant in participants:
            if str(participant.userId) != str(self.user.id):
                try:
                    receiver = User.objects.get(id=participant.userId)
                    send_notification(
                        user=receiver,
                        title=f"New message from {self.user.name}",
                        body=msg.content[:100] if msg.content else "Sent a file",
                        data={"conversation_id": self.conversation_id}
                    )
                except User.DoesNotExist:
                    pass

        # Updating lastReadAt for the user, user read the messages before he sent the message
        self.update_last_read_at()

    def typing_status(self, content):
        status = content["status"]
        async_to_sync(self.channel_layer.group_send)(
            self.conversation_id,
            {
                "type": "typing",
                "userId": str(self.user.id),
                "username": str(self.user.name),
                "conversationId": self.conversation_id,
                "status": status,
            },
        )

    def update_last_read_at(self):
        now = timezone.now()

        # Update UserConversation doc
        UserConversation.objects(
            userId=str(self.user.id), conversationId=self.conversation_id
        ).update_one(set__lastReadAt=now, set__unreadCount=0)

        # Update the message readBy till now
        MongoMessage.objects(
            Q(conversationId=self.conversation_id) &
            Q(timestamp__lte=now) &
            Q(readBy__not__elemMatch={"userId": self.user.id})
        ).update(
            add_to_set__readBy={"userId": self.user.id, "readAt": now}
        )

        # Broadcast back to group (so other clients of this user or admins know)
        async_to_sync(self.channel_layer.group_send)(
            self.conversation_id,
            {
                "type": "last_read_update",
                "userId": str(self.user.id),
                "conversationId": self.conversation_id,
                "lastReadAt": now.isoformat(),
            },
        )

        # Ack to the same client (so UI updates divider)
        self.send_json({
            "type": "read_messages_ack",
            "conversationId": self.conversation_id,
            "lastReadAt": now.isoformat(),
        })

    def receive_json(self, content, **kwargs):
        message_type = content["type"]

        if message_type == "chat_message":
            self.save_message(content)

        elif message_type == "typing":
            self.typing_status(content)

        elif message_type == "presence_updates":
            if str(content["user_id"]) == str(self.other_user_id):
                async_to_sync(self.channel_layer.group_send)(
                    self.conversation_id,
                    {
                        "type": "presence",
                        "user_id": content["user_id"],
                        "status": content["status"],
                        "last_seen": get_last_seen(self.other_user_id),
                    },
                )

        elif message_type == "read_messages":
            self.update_last_read_at()


        # TODO - Connection check
        elif message_type == "ping":
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_id,
                {
                    "type": "pong"
                },
            )

        return super().receive_json(content, **kwargs)

    # --- Presence handler ---
    def user_status(self, event):
        """
        Handles presence updates (online/offline).
        """
        self.send_json({
            "type": "presence",
            "user_id": event["user_id"],
            "status": event["status"],
            "last_seen": get_last_seen(self.other_user_id),
        })

    def chat_message_echo(self, event):
        self.send_json(event)

    def typing(self, event):
        self.send_json(event)

    def user_join(self, event):
        self.send_json(event)

    def user_leave(self, event):
        self.send_json(event)

    def unread_count(self, event):
        self.send_json(event)

    def pong(self, event):
        self.send_json(event)

    def message_read(self, event):
        self.send_json(event)

    def presence(self, event):
        self.send_json(event)

    def last_read_update(self, event):
        self.send_json(event)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=UUIDEncoder)
