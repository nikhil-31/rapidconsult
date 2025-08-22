from datetime import datetime
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from config.utils import upload_to_spaces
from rapidconsult.chats.models import Conversation, Message, User
from rapidconsult.chats.mongo.models import UserConversation, Message as MongoMessage, LastMessageInfo, \
    Conversation as MongoConversation
from .mongo import create_direct_message, create_group_chat
from .paginaters import MessagePagination
from .pagination import UserConversationPagination
from .permissions import HasOrgLocationAccess
from .serializers import ConversationSerializer, MessageSerializer, UserConversationSerializer, DirectMessageSerializer, \
    GroupChatSerializer, MongoMessageSerializer
from ..consumers import VoxChatConsumer
from bson import ObjectId
from mongoengine.errors import ValidationError


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
        GET /api/active-conversations/?user_id=user_12345&organization_id=1&location_id=1
    """
    pagination_class = UserConversationPagination
    permission_classes = [HasOrgLocationAccess]

    def create(self, request):
        conv_type = request.data.get("type")
        organization_id = request.data.get("organization_id")
        location_id = request.data.get("location_id")
        user_id = str(request.user.id)

        if conv_type == "direct":
            serializer = DirectMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            conv = create_direct_message(data["user1_id"], data["user2_id"], organization_id=organization_id,
                                         location_id=location_id, )
            return Response({"conversation_id": str(conv.id)}, status=status.HTTP_201_CREATED)

        elif conv_type == "group":
            serializer = GroupChatSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            conv = create_group_chat(
                user_id,
                data["name"],
                data.get("description", ""),
                data["member_ids"],
                organization_id=organization_id,
                location_id=location_id,
            )
            return Response({"conversation_id": str(conv.id)}, status=status.HTTP_201_CREATED)

        return Response({"error": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request):
        user_id = str(request.user.id)
        organization_id = request.query_params.get("organization_id")
        location_id = request.query_params.get("location_id")

        # Check if user exists in the collection
        if not UserConversation.objects(userId=user_id).first():
            return Response(
                {"error": f"No conversations found for user_id '{user_id}'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = UserConversation.objects(userId=user_id, organizationId=organization_id,
                                            locationId=location_id).order_by("-updatedAt")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)

        serializer = UserConversationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MongoMessageViewSet(viewsets.ViewSet):
    """
    Returns paginated messages for a given conversation.
    Example:
        GET /api/messages/?conversation_id=abc123&page=1&page_size=50
    """
    pagination_class = MessagePagination
    permission_classes = [HasOrgLocationAccess]

    def list(self, request):
        conversation_id = request.query_params.get("conversation_id")

        if not conversation_id:
            return Response({"error": "conversation_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        filters = {"conversationId": conversation_id}

        queryset = MongoMessage.objects(**filters).order_by("-timestamp")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MongoMessageSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)


class ImageMessageViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated, HasOrgLocationAccess]

    def create(self, request):
        conversation_id = request.data.get("conversationId")
        content = request.data.get("content") or ""
        file = request.data.get("file")
        reply_to = request.data.get("replyTo") or ""
        organization_id = request.data.get("organizationId")
        location_id = request.data.get("locationId")

        if not conversation_id:
            return Response({"error": "Missing conversationId"}, status=400)

        try:
            # Validate ObjectId format
            if not ObjectId.is_valid(conversation_id):
                return Response({"error": "Invalid conversationId"}, status=status.HTTP_400_BAD_REQUEST)

            conversation = MongoConversation.objects(id=conversation_id).first()
        except ValidationError:
            return Response({"error": "Invalid conversationId"}, status=status.HTTP_400_BAD_REQUEST)

        # Detect a message type
        if file:
            # Upload image/file to DigitalOcean Spaces
            file_url = upload_to_spaces(file, folder="chat")

            if reply_to is not None and reply_to != "":
                replied_to_message = MongoMessage.objects.get(conversationId=conversation_id,
                                                              id=reply_to)
            else:
                replied_to_message = None

            msg = MongoMessage.objects.create(
                conversationId=conversation_id,
                senderId=str(request.user.id),
                senderName=request.user.username,
                content=content,
                type="file",
                timestamp=datetime.utcnow(),
                replyTo=replied_to_message,
                media={
                    "url": file_url,
                    "filename": file.name,
                    "size": file.size,
                    "mimeType": file.content_type,
                },
                locationId=str(location_id),
                organizationId=str(organization_id),
            )
        else:
            # Plain text message
            if not content.strip():
                return Response({"error": "Message must have text or file"}, status=400)

            if reply_to is not None and reply_to != "":
                replied_to_message = MongoMessage.objects.get(conversationId=conversation_id,
                                                              id=reply_to)
            else:
                replied_to_message = None

            msg = MongoMessage.objects.create(
                conversationId=conversation_id,
                senderId=str(request.user.id),
                senderName=request.user.username,
                content=content,
                type="text",
                replyTo=replied_to_message,
                timestamp=datetime.utcnow(),
                locationId=str(location_id),
                organizationId=str(organization_id),
            )

        # Update last message in UserConversation
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

        # Broadcast over WebSocket
        channel_layer = get_channel_layer()
        # Broadcast to group
        async_to_sync(channel_layer.group_send)(
            conversation_id,
            {
                "type": "chat_message_echo",
                "message": VoxChatConsumer.serialize_message(msg),
            }
        )

        return Response(VoxChatConsumer.serialize_message(msg))
