from rest_framework.routers import DefaultRouter
from scheduling.api.views import OnCallShiftViewSet

router = DefaultRouter()
router.register(r"shifts", OnCallShiftViewSet, basename="shift")

urlpatterns = router.urls
