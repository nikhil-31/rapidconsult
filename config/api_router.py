from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from rapidconsult.chats.api.views import ConversationViewSet, MessageViewSet, ImageMessageUploadView, \
    UserConversationViewSet, MongoMessageViewSet
from rapidconsult.users.api.views import UserViewSet, ContactViewSet
from rapidconsult.scheduling.api.views import (LocationViewSet, DepartmentViewSet, UnitViewSet, OrganizationViewSet,
                                               UserProfileViewSet, RoleViewSet, UnitMembershipViewSet,
                                               OnCallShiftViewSet, UserOrgProfileViewSet)

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet, basename="users")
router.register("conversations", ConversationViewSet, basename="conversations")
router.register("messages-depr", MessageViewSet, basename="messages-depr")
router.register("messages", MongoMessageViewSet, basename="messages")
router.register("locations", LocationViewSet, basename="locations")
router.register("departments", DepartmentViewSet, basename="departments")
router.register("units", UnitViewSet, basename="units")
router.register("organizations", OrganizationViewSet, basename="organizations")
router.register("profile", UserProfileViewSet, basename="profile")
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'unit-memberships', UnitMembershipViewSet, basename='unit-memberships')
router.register(r'shifts', OnCallShiftViewSet, basename='shifts')
router.register(r'allowed-location', UserOrgProfileViewSet, basename='allowed-location')
router.register(r'active-conversations', UserConversationViewSet, basename='active-conversations')

app_name = "api"
urlpatterns = router.urls
