from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from rapidconsult.chats.api.views import ConversationViewSet, MessageViewSet, ImageMessageUploadView
from rapidconsult.users.api.views import UserViewSet, ContactViewSet
from rapidconsult.scheduling.api.views import (LocationViewSet, DepartmentViewSet, UnitViewSet, OrganizationViewSet,
                                               UserProfileViewSet, RoleViewSet)

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)
router.register("conversations", ConversationViewSet)
router.register("messages", MessageViewSet)
router.register("locations", LocationViewSet, basename="locations")
router.register("departments", DepartmentViewSet)
router.register("units", UnitViewSet)
router.register("organizations", OrganizationViewSet)
router.register("profile", UserProfileViewSet, basename="profile")
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'roles', RoleViewSet, basename='roles')

app_name = "api"
urlpatterns = router.urls
