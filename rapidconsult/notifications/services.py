import logging
from .models import UserDevice
from .providers import FCMNotificationProvider

logger = logging.getLogger(__name__)

# Initialize providers
# In a real app, you might want to load these dynamically or via settings
fcm_provider = FCMNotificationProvider()

def send_notification(user, title, body, data=None):
    """
    Send notification to all active devices of the user.
    """
    devices = UserDevice.objects.filter(user=user, active=True)
    
    fcm_tokens = list(devices.filter(type='fcm').values_list('registration_id', flat=True))
    
    if fcm_tokens:
        failed_tokens = fcm_provider.send(fcm_tokens, title, body, data)
        if failed_tokens:
            # Handle invalid tokens (e.g., deactivate them)
            UserDevice.objects.filter(registration_id__in=failed_tokens).update(active=False)
            logger.info(f"Deactivated {len(failed_tokens)} invalid tokens.")

    # Add other providers here if needed
