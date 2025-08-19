from django.urls import path
from rapidconsult.chats.consumers import ChatConsumer, NotificationConsumer, VoxChatConsumer

websocket_urlpatterns = [
    path("chats/<conversation_name>/", ChatConsumer.as_asgi()),
    path("notifications/", NotificationConsumer.as_asgi()),
    path("voxchats/<conversation_id>/", VoxChatConsumer.as_asgi()),
]
