import json
from uuid import UUID

from channels.generic.websocket import JsonWebsocketConsumer, AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

from rapidconsult.chats.models import Conversation, Message, User
from rapidconsult.chats.api.serializers import MessageSerializer


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # if the obj is uuid, we simply return the value of uuid
            return obj.hex
        return json.JSONEncoder.default(self, obj)


class ChatConsumer(JsonWebsocketConsumer):

    def __init__(self):
        super().__init__()
        # self.room_name = "room"
        # self.channel_name = "channel"oo9
        self.user = None
        self.conversation_name = None
        self.conversation = None

    def connect(self):
        # print("Connected!")
        #
        # self.user = self.scope["user"]
        # if not self.user.is_authenticated:
        #     print("User is not authenticated")
        #     return
        #
        # # self.room_name = "home"
        # self.accept()
        # async_to_sync(self.channel_layer.group_add)(
        #     self.room_name,
        #     self.channel_name,
        # )
        # self.send_json(
        #     {
        #         "type": "welcome_message",
        #         "message": "Hey there! You've successfully connected!",
        #     }
        # )

        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return

        self.accept()
        print(f"Url route {self.scope['url_route']}")
        self.conversation_name = f"{self.scope['url_route']['kwargs']['conversation_name']}"
        self.conversation, created = Conversation.objects.get_or_create(name=self.conversation_name)

        async_to_sync(self.channel_layer.group_add)(
            self.conversation_name,
            self.channel_name,
        )

        messages = self.conversation.messages.all().order_by("-timestamp")[0:50]
        message_count = self.conversation.messages.all().count()
        self.send_json({
            "type": "last_50_messages",
            "messages": MessageSerializer(messages, many=True).data,
            "message_count": message_count,
            "has_more": message_count > 50,
        })

    def disconnect(self, code):
        print("Disconnected!")
        return super().disconnect(code)

    def receive_json(self, content, **kwargs):
        print(content)
        message_type = content["type"]
        if message_type == "chat_message":
            message = Message.objects.create(
                from_user=self.user,
                to_user=self.get_message_receiver(),
                content=content["message"],
                conversation=self.conversation
            )

            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    "type": "chat_message_echo",
                    "name": content["name"],
                    "message": MessageSerializer(message).data,
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
        print(event)
        self.send_json(event)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=UUIDEncoder)

# class ChatConsumer(AsyncWebsocketConsumer):
#
#     def __init__(self):
#         super().__init__()
#         self.room_name = None
#         self.room_group_name = None
#
#     async def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = f"chat_{self.room_name}"
#         print("connected")
#         self.room_name = "home"
#         self.accept()
#         await self.send_json(
#             {
#                 "type": "welcome_message",
#                 "message": "Hey there! You've successfully connected!",
#             }
#         )
#
#     def disconnect(self, code):
#         print("Disconnected!")
#         return super().disconnect(code)
#
#     def receive_json(self, content, **kwargs):
#         print(content)
#         return super().receive_json(content, **kwargs)
