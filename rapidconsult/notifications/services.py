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
    logger.info(f"Attempting to send notification to user {user.id} ({getattr(user, 'username', 'N/A')}): {title}")
    
    # Get all active devices for the user
    devices = UserDevice.objects.filter(user=user, active=True)
    total_devices = devices.count()
    logger.info(f"Found {total_devices} active device(s) for user {user.id}")
    
    if total_devices == 0:
        logger.warning(f"No active devices found for user {user.id}. Notification not sent.")
        return
    
    # Get FCM tokens, filtering out None and empty values
    fcm_tokens = [
        token for token in 
        devices.filter(type='fcm').values_list('registration_id', flat=True)
        if token and token.strip()  # Filter out None, empty strings, and whitespace-only strings
    ]
    
    logger.info(f"Retrieved {len(fcm_tokens)} valid FCM token(s) for user {user.id}")
    
    if not fcm_tokens:
        logger.warning(f"No valid FCM tokens found for user {user.id}. Notification not sent.")
        return
    
    logger.info(f"Sending notification to {len(fcm_tokens)} device(s): {title} - {body}")
    failed_tokens = fcm_provider.send(fcm_tokens, title, body, data)
    
    if failed_tokens:
        # Handle invalid tokens (e.g., deactivate them)
        deactivated_count = UserDevice.objects.filter(registration_id__in=failed_tokens).update(active=False)
        logger.info(f"Deactivated {deactivated_count} invalid token(s) for user {user.id}.")
    else:
        logger.info(f"Successfully sent notification to all {len(fcm_tokens)} device(s) for user {user.id}")

    # Add other providers here if needed
