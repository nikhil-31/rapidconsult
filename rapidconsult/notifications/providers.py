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
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized."""
        if firebase_admin._apps:
            return  # Already initialized

        cred_path = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_PATH', None)

        if not cred_path:
            logger.warning(
                "FIREBASE_SERVICE_ACCOUNT_PATH not found in settings. FCM will not work."
            )
            return

        try:
            import os

            # Normalize path
            cred_path = str(cred_path)

            if not os.path.exists(cred_path):
                logger.warning(
                    f"Firebase credentials file not found at {cred_path}. FCM will not work."
                )
                return

            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info(
                f"Firebase Admin SDK initialized successfully with credentials from {cred_path}"
            )

        except Exception as e:
            logger.error(
                f"Failed to initialize Firebase Admin SDK: {e}", exc_info=True
            )

    def send(self, tokens, title, body, data=None):
        if not tokens:
            return []

        # Lazy init (important for gunicorn / daphne / multiprocess)
        if not firebase_admin._apps:
            self._initialize_firebase()

        if not firebase_admin._apps:
            logger.error("Firebase app not initialized. Cannot send notification.")
            return tokens  # treat all as failed

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )

        failed_tokens = []

        try:
            # ✅ FIX: use HTTP v1 safe API (no /batch endpoint)
            response = messaging.send_each_for_multicast(message)

            logger.info(
                "FCM multicast send complete: %s success, %s failure",
                response.success_count,
                response.failure_count,
            )

            if response.failure_count > 0:
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        token = tokens[idx]
                        failed_tokens.append(token)

                        logger.error(
                            "FCM send failed for token %s: %s",
                            token,
                            resp.exception,
                        )

            return failed_tokens

        except Exception as e:
            # If something catastrophic happens, assume all failed
            logger.exception(f"Error sending FCM message: {e}")
            return tokens
