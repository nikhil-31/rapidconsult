from channels.generic.websocket import JsonWebsocketConsumer, AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

class ChatConsumer(JsonWebsocketConsumer):

    def __init__(self):
        super().__init__()
        self.room_name = "room"
        # self.channel_name = "channel"
        self.user = None

    def connect(self):
        print("Connected!")

        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            print("User is not authenticated")
            return

        self.room_name = "home"
        self.accept()
        async_to_sync(self.channel_layer.group_add)(
            self.room_name,
            self.channel_name,
        )
        self.send_json(
            {
                "type": "welcome_message",
                "message": "Hey there! You've successfully connected!",
            }
        )

    def disconnect(self, code):
        print("Disconnected!")
        return super().disconnect(code)

    def receive_json(self, content, **kwargs):
        print(content)
        message_type = content["type"]
        if message_type == "chat_message":
            async_to_sync(self.channel_layer.group_send)(
                self.room_name,
                {
                    "type": "chat_message_echo",
                    "name": content["name"],
                    "message": content["message"],
                },
            )
        return super().receive_json(content, **kwargs)

    def chat_message_echo(self, event):
        print(event)
        self.send_json(event)

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
