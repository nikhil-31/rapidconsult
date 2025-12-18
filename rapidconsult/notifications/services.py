import logging

from .models import UserDevice
from .providers import APNSNotificationProvider, FCMNotificationProvider

logger = logging.getLogger(__name__)

# Initialize providers
# In a real app, you might want to load these dynamically or via settings
fcm_provider = FCMNotificationProvider()
apns_provider = APNSNotificationProvider()


def _clean_tokens(queryset):
    """Return list of non-empty registration IDs from the given queryset."""
    return [
        token
        for token in queryset.values_list("registration_id", flat=True)
        if token and str(token).strip()
    ]


def send_notification(user, title, body, data=None):
    """
    Send notification to all active devices of the user (Android/Web via FCM,
    iOS via APNS).
    """
    logger.info(
        "Attempting to send notification to user %s (%s): %s",
        user.id,
        getattr(user, "username", "N/A"),
        title,
    )

    # Get all active devices for the user
    devices = UserDevice.objects.filter(user=user, active=True)
    total_devices = devices.count()
    logger.info("Found %s active device(s) for user %s", total_devices, user.id)

    if total_devices == 0:
        logger.warning(
            "No active devices found for user %s. Notification not sent.",
            user.id,
        )
        return

    # Get FCM tokens
    fcm_tokens = _clean_tokens(devices.filter(type="fcm"))
    logger.info(
        "Retrieved %s valid FCM token(s) for user %s",
        len(fcm_tokens),
        user.id,
    )

    # Get APNS tokens (iOS)
    apns_tokens = _clean_tokens(devices.filter(type="apns"))
    logger.info(
        "Retrieved %s valid APNS token(s) for user %s",
        len(apns_tokens),
        user.id,
    )

    if not fcm_tokens and not apns_tokens:
        logger.warning(
            "No valid push tokens (FCM/APNS) found for user %s. "
            "Notification not sent.",
            user.id,
        )
        return

    # Send via FCM
    if fcm_tokens:
        logger.info(
            "Sending FCM notification to %s device(s): %s - %s",
            len(fcm_tokens),
            title,
            body,
        )
        failed_fcm = fcm_provider.send(fcm_tokens, title, body, data)
        if failed_fcm:
            deactivated_count = UserDevice.objects.filter(
                registration_id__in=failed_fcm
            ).update(active=False)
            logger.info(
                "Deactivated %s invalid FCM token(s) for user %s.",
                deactivated_count,
                user.id,
            )
        else:
            logger.info(
                "Successfully sent FCM notification to all %s device(s) for user %s",
                len(fcm_tokens),
                user.id,
            )

    # Send via APNS (iOS)
    if apns_tokens:
        logger.info(
            "Sending APNS notification to %s iOS device(s): %s - %s",
            len(apns_tokens),
            title,
            body,
        )
        failed_apns = apns_provider.send(apns_tokens, title, body, data)
        if failed_apns:
            deactivated_count = UserDevice.objects.filter(
                registration_id__in=failed_apns
            ).update(active=False)
            logger.info(
                "Deactivated %s invalid APNS token(s) for user %s.",
                deactivated_count,
                user.id,
            )
        else:
            logger.info(
                "Successfully sent APNS notification to all %s iOS device(s) for user %s",
                len(apns_tokens),
                user.id,
            )

