from django.conf import settings
from django.contrib import admin
from django.urls import include
from django.urls import path
from django.views import defaults as default_views
# from drf_spectacular.views import SpectacularAPIView
# from drf_spectacular.views import SpectacularSwaggerView

from rapidconsult.users.api.views import CustomObtainAuthTokenView
from rapidconsult.chats.views import HomePageView

urlpatterns = [
    # Django Admin, use {% url 'admin:index' %}
    path(settings.ADMIN_URL, admin.site.urls),
    # User management
    path("users/", include("rapidconsult.users.urls", namespace="users")),
    # path("accounts/", include("allauth.urls")),
    path("", HomePageView.as_view(), name="home"),
]

# API URLS
urlpatterns += [
    # API base url
    path("api/", include("config.api_router")),
    # DRF auth token
    # path("api/auth-token/", obtain_auth_token, name="obtain_auth_token"),
    path("api/auth-token/", CustomObtainAuthTokenView.as_view(), name="obtain_auth_token"),

    # path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    # path(
    #     "api/docs/",
    #     SpectacularSwaggerView.as_view(url_name="api-schema"),
    #     name="api-docs",
    # ),
]

if settings.DEBUG:
    # This allows the error pages to be debugged during development, just visit
    # these url in browser to see how these error pages look like.
    urlpatterns += [
        path(
            "400/",
            default_views.bad_request,
            kwargs={"exception": Exception("Bad Request!")},
        ),
        path(
            "403/",
            default_views.permission_denied,
            kwargs={"exception": Exception("Permission Denied")},
        ),
        path(
            "404/",
            default_views.page_not_found,
            kwargs={"exception": Exception("Page not Found")},
        ),
        path("500/", default_views.server_error),
    ]
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
            *urlpatterns,
        ]
