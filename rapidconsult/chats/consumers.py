import json
from uuid import UUID

from django.utils import timezone
from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync
from rapidconsult.chats.models import Conversation, Message, User
from rapidconsult.chats.api.serializers import MessageSerializer
from rapidconsult.chats.mongo.models import Conversation as MongoConversation, Message as MongoMessage, \
    User as MongoUser


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

        unread_count = Message.objects.filter(to_user=self.user, read=False).count()
        self.send_json({
            "type": "unread_count",
            "unread_count": unread_count,
        })

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.notification_group_name,
            self.channel_name,
        )
        return super().disconnect(code)

    def new_message_notification(self, event):
        self.send_json(event)

    def unread_count(self, event):
        self.send_json(event)


class VoxChatConsumer(JsonWebsocketConsumer):

    def __init__(self):
        super().__init__()
        self.user = None
        self.conversation_id = None
        self.conversation = None

    def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return

        self.accept()

        # Getting the conversation name using URL route
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation = MongoConversation.objects(_id=self.conversation_id)

        async_to_sync(self.channel_layer.group_add)(
            self.conversation_id,
            self.channel_name,
        )

        # TODO - Remove this later - Sending welcome message
        self.send_json({
            "type": "welcome_message",
            "message": "Hi connected",
        })

        # TODO - Send last 50 messages
        # messages = self.conversation.messages.all().order_by("-timestamp")[:50]
        # message_count = self.conversation.messages.count()

        # self.send_json({
        #     "type": "last_50_messages",
        #     "messages": MessageSerializer(messages, many=True).data,
        #     "message_count": message_count,
        #     "has_more": message_count > 50,
        # })
        last_msgs = MongoMessage.objects(conversationId=self.conversation_id).order_by("-timestamp")[:50]
        total_count = MongoMessage.objects(conversationId=self.conversation_id).count()

        serialized = [
            {
                "id": str(msg.id),
                "conversationId": msg.conversationId,
                "senderId": msg.senderId,
                "content": msg.content,
                "messageType": msg.type,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "replyTo": msg.replyTo,
            }
            for msg in reversed(last_msgs)  # chronological order
        ]
        has_more = total_count > 50
        self.send_json({
            "type": "last_50_messages",
            "messages": serialized,
            "message_count": len(serialized),
            "has_more": has_more,
        })

        # TODO - Send a list of all online users
        # self.send_json({
        #     "type": "online_user_list",
        #     "users": [user.username for user in self.conversation.online.all()],
        # })

        # TODO - Current User joined the group
        # async_to_sync(self.channel_layer.group_send)(
        #     self.conversation_name,
        #     {
        #         "type": "user_join",
        #         "user": self.user.username,
        #     },
        # )
        # self.conversation.online.add(self.user)

        # TODO - Initial unread count of messages that were not read
        # unread_count = Message.objects.filter(to_user=self.user, read=False).count()
        # self.send_json({
        #     "type": "unread_count",
        #     "unread_count": unread_count,
        # })

    def disconnect(self, code):
        print("Disconnected!")
        if self.user.is_authenticated:
            # TODO - User is marked as offline and leaves the group/direct message
            # async_to_sync(self.channel_layer.group_send)(
            #     self.conversation_name,
            #     {
            #         "type": "user_leave",
            #         "user": self.user.username,
            #     },
            # )
            # self.conversation.online.remove(self.user)
            pass
        return super().disconnect(code)

    def receive_json(self, content, **kwargs):
        message_type = content["type"]

        if message_type == "chat_message":
            msg = MongoMessage(
                conversationId=content["conversationId"],
                senderId=str(self.user.id),
                content=content.get("content"),
                type=content.get("messageType", "text"),
                timestamp=timezone.now(),
                replyTo=content.get("replyTo"),
                locationId=str(content.get("locationId")),
                organizationId=str(content.get("organizationId")),
            )
            msg.save()

            # Broadcast to group
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_id,
                {
                    "type": "chat_message_echo",
                    "id": str(msg.id),
                    "conversationId": msg.conversationId,
                    "senderId": msg.senderId,
                    "content": msg.content,
                    "messageType": msg.type,
                    "timestamp": msg.timestamp.isoformat(),
                    "replyTo": msg.replyTo,
                }
            )

            # message = Message.objects.create(
            #     from_user=self.user,
            #     to_user=self.get_message_receiver(),
            #     content=content.get("message", ""),
            #     conversation=self.conversation
            # )

            # async_to_sync(self.channel_layer.group_send)(
            #     self.id,
            #     {
            #         "type": "chat_message_echo",
            #         "name": content.get("name", ""),
            #         "message": MessageSerializer(message).data,
            #     },
            # )

        # TODO - User is typing echo to the rest of the group
        elif message_type == "typing":
            # async_to_sync(self.channel_layer.group_send)(
            #     self.conversation_name,
            #     {
            #         "type": "typing",
            #         "user": self.user.username,
            #         "typing": content["typing"],
            #     },
            # )
            pass

        # TODO - Update that messages were read
        elif message_type == "read_messages":
            # Mark all messages sent *to me* as read
            # messages_to_me = self.conversation.messages.filter(to_user=self.user, read=False)
            #
            # for msg in messages_to_me:
            #     async_to_sync(self.channel_layer.group_send)(
            #         self.conversation_name,
            #         {
            #             "type": "message_read",
            #             "message_id": str(msg.id),
            #         }
            #     )
            #
            # # TODO - Update unread count for user
            # unread_count = Message.objects.filter(to_user=self.user, read=False).count()
            # async_to_sync(self.channel_layer.group_send)(
            #     self.user.username + "__notifications",
            #     {
            #         "type": "unread_count",
            #         "unread_count": unread_count,
            #     },
            # )
            # messages_to_me.update(read=True)
            pass

        # TODO - Connection check
        elif message_type == "ping":
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_id,
                {
                    "type": "pong"
                },
            )

        return super().receive_json(content, **kwargs)

    def get_message_receiver(self):
        pass
        # usernames = self.conversation_id.split("__")
        # for username in usernames:
        #     if username != self.user.username:
        #         # This is the receiver
        #         return User.objects.get(username=username)
        # return User.objects.get_or_create(username="test")

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
