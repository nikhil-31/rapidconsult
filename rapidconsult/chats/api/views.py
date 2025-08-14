from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rapidconsult.chats.models import Conversation, Message, User
from rapidconsult.chats.mongo.models import UserConversation
from .mongo import create_direct_message, create_group_chat
from .paginaters import MessagePagination
from .pagination import UserConversationPagination
from .serializers import ConversationSerializer, MessageSerializer, UserConversationSerializer, DirectMessageSerializer, \
    GroupChatSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class ConversationViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = ConversationSerializer
    queryset = Conversation.objects.none()
    lookup_field = "name"

    def get_queryset(self):
        queryset = Conversation.objects.filter(
            name__contains=self.request.user.username
        )
        return queryset

    def get_serializer_context(self):
        return {"request": self.request, "user": self.request.user}


class MessageViewSet(ListModelMixin, GenericViewSet):
    serializer_class = MessageSerializer
    queryset = Message.objects.none()
    pagination_class = MessagePagination

    def get_queryset(self):
        conversation_name = self.request.GET.get("conversation")
        queryset = (
            Message.objects.filter(
                conversation__name__contains=self.request.user.username,
            )
            .filter(conversation__name=conversation_name)
            .order_by("-timestamp")
        )
        return queryset


class ImageMessageUploadView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def get_message_receiver(self, conversation_name, user):
        usernames = conversation_name.split("__")
        for username in usernames:
            if username != user.username:
                # This is the receiver
                return User.objects.get(username=username)
        return User.objects.get_or_create(username="test")

    def post(self, request):
        file = request.data.get('file')
        conversation_name = request.data.get('conversation')
        content = request.data.get('content') or ""

        if not file or not conversation_name:
            return Response({'error': 'Missing data'}, status=400)

        conversation, _ = Conversation.objects.get_or_create(name=conversation_name)
        msg = Message.objects.create(
            from_user=request.user,
            to_user=self.get_message_receiver(conversation_name, request.user),
            file=file,
            conversation=conversation,
            content=content  # optional
        )

        # ✅ Send the message to WebSocket group
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            conversation_name,
            {
                "type": "chat_message_echo",
                "name": request.user.username,
                "message": MessageSerializer(msg).data,
            }
        )
        return Response(MessageSerializer(msg).data)


class UserConversationViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing user conversations filtered by userId.
    Example:
        GET /api/active-conversations/?userId=user_12345
    """
    pagination_class = UserConversationPagination

    def create(self, request):
        conv_type = request.data.get("type")

        if conv_type == "direct":
            serializer = DirectMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            conv = create_direct_message(data["user1_id"], data["user2_id"])
            return Response({"conversation_id": str(conv.id)}, status=status.HTTP_201_CREATED)

        elif conv_type == "group":
            serializer = GroupChatSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            conv = create_group_chat(
                data["created_by_id"],
                data["name"],
                data.get("description", ""),
                data["member_ids"]
            )
            return Response({"conversation_id": str(conv.id)}, status=status.HTTP_201_CREATED)

        return Response({"error": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request):
        user_id = request.query_params.get("userId")
        if not user_id:
            return Response(
                {"error": "userId query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists in the collection
        if not UserConversation.objects(userId=user_id).first():
            return Response(
                {"error": f"No conversations found for userId '{user_id}'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = UserConversation.objects(userId=user_id).order_by("-updatedAt")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)

        serializer = UserConversationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
