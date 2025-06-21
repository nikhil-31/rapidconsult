"""
ASGI config

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/dev/howto/deployment/asgi/

"""
import os
import sys
import django
from pathlib import Path

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)


# If DJANGO_SETTINGS_MODULE is unset, default to the local settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

django.setup()

from django.core.asgi import get_asgi_application
from rapidconsult.chats.middleware import TokenAuthMiddleware

# This allows easy placement of apps within the interior
# rapidconsult directory.

# ROOT_DIR = Path(__file__).resolve(strict=True).parent.parent
# sys.path.append(str(ROOT_DIR / "rapidconsult"))

# This application object is used by any ASGI server configured to use this file.
django_application = get_asgi_application()

# Import websocket application here, so apps from django_application are loaded first
from config import routing  # noqa isort:skip

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa isort:skip

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": TokenAuthMiddleware(URLRouter(routing.websocket_urlpatterns)),
    }
)
