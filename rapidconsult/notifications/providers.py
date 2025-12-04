import logging
from abc import ABC, abstractmethod
from django.conf import settings
import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)

class BaseNotificationProvider(ABC):
    @abstractmethod
    def send(self, tokens, title, body, data=None):
        pass

class FCMNotificationProvider(BaseNotificationProvider):
    def __init__(self):
        if not firebase_admin._apps:
            cred_path = getattr(settings, 'FCM_CREDENTIALS', None)
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                logger.warning("FCM_CREDENTIALS not found in settings. FCM will not work.")

    def send(self, tokens, title, body, data=None):
        if not tokens:
            return

        if not firebase_admin._apps:
            logger.error("Firebase app not initialized. Cannot send notification.")
            return

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )

        try:
            response = messaging.send_multicast(message)
            logger.info(f"Successfully sent message: {response}")
            if response.failure_count > 0:
                responses = response.responses
                failed_tokens = []
                for idx, resp in enumerate(responses):
                    if not resp.success:
                        # The order of responses corresponds to the order of the registration tokens.
                        failed_tokens.append(tokens[idx])
                        logger.error(f"Failed to send to token {tokens[idx]}: {resp.exception}")
                return failed_tokens
        except Exception as e:
            logger.exception(f"Error sending FCM message: {e}")
            return tokens # Return all as failed if batch fails? Or just log.
