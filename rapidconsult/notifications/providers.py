import logging
from abc import ABC, abstractmethod

from django.conf import settings
import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)


class BaseNotificationProvider(ABC):
    @abstractmethod
    def send(self, tokens, title, body, data=None):
        """Send a push notification to one or more device tokens.

        Implementations should return a list of tokens that failed so callers
        can deactivate them.
        """
        raise NotImplementedError


class FCMNotificationProvider(BaseNotificationProvider):
    """Firebase Cloud Messaging provider (typically Android / web)."""

    def __init__(self):
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized."""
        if firebase_admin._apps:
            return  # Already initialized

        cred_path = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_PATH", None)

        if not cred_path:
            logger.warning(
                "FIREBASE_SERVICE_ACCOUNT_PATH not found in settings. "
                "FCM will not work."
            )
            return

        try:
            import os

            # Normalize path
            cred_path = str(cred_path)

            if not os.path.exists(cred_path):
                logger.warning(
                    "Firebase credentials file not found at %s. FCM will not work.",
                    cred_path,
                )
                return

            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info(
                "Firebase Admin SDK initialized successfully with credentials "
                "from %s",
                cred_path,
            )

        except Exception as e:  # noqa: BLE001
            logger.error("Failed to initialize Firebase Admin SDK: %s", e, exc_info=True)

    def send(self, tokens, title, body, data=None):
        if not tokens:
            logger.warning("FCM send called with empty tokens list")
            return []

        logger.info(
            "FCM send called with %s token(s), title: '%s', body: '%s'",
            len(tokens),
            title,
            body,
        )

        # Lazy init (important for gunicorn / daphne / multiprocess)
        if not firebase_admin._apps:
            logger.info("Firebase app not initialized, attempting initialization...")
            self._initialize_firebase()

        if not firebase_admin._apps:
            logger.error("Firebase app not initialized. Cannot send notification.")
            logger.error(
                "Check FIREBASE_SERVICE_ACCOUNT_PATH setting and credentials file."
            )
            return tokens  # treat all as failed

        logger.debug("Creating FCM message with %s token(s)", len(tokens))
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )

        failed_tokens: list[str] = []

        try:
            # Use HTTP v1 safe API (no /batch endpoint)
            logger.debug("Sending FCM multicast message...")
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

        except Exception as e:  # noqa: BLE001
            # If something catastrophic happens, assume all failed
            logger.exception("Error sending FCM message: %s", e)
            return tokens


class APNSNotificationProvider(BaseNotificationProvider):
    """Apple Push Notification service provider (iOS)."""

    def __init__(self):
        self._client = None
        self._bundle_id = None
        self._initialize_apns()

    def _initialize_apns(self):
        """Initialise APNS client if credentials are configured."""
        # Delay heavy imports until we know we actually want APNS
        try:
            from apns2.client import APNsClient  # type: ignore[import-not-found]
            from apns2.credentials import (  # type: ignore[import-not-found]
                TokenCredentials,
            )
        except Exception:  # noqa: BLE001
            logger.warning(
                "apns2 package not installed; APNS push notifications are disabled."
            )
            return

        auth_key_path = getattr(settings, "APNS_AUTH_KEY_PATH", None)
        auth_key_id = getattr(settings, "APNS_AUTH_KEY_ID", None)
        team_id = getattr(settings, "APNS_TEAM_ID", None)
        bundle_id = getattr(settings, "APNS_BUNDLE_ID", None)
        use_sandbox = getattr(settings, "APNS_USE_SANDBOX", True)

        if not all([auth_key_path, auth_key_id, team_id, bundle_id]):
            logger.warning(
                "APNS settings incomplete (APNS_AUTH_KEY_PATH / APNS_AUTH_KEY_ID / "
                "APNS_TEAM_ID / APNS_BUNDLE_ID). APNS will not be used."
            )
            return

        try:
            credentials = TokenCredentials(
                auth_key_path=str(auth_key_path),
                team_id=str(team_id),
                key_id=str(auth_key_id),
            )
            self._client = APNsClient(
                credentials=credentials,
                use_sandbox=bool(use_sandbox),
            )
            self._bundle_id = str(bundle_id)
            logger.info(
                "APNS client initialised successfully (sandbox=%s).", use_sandbox
            )
        except Exception as e:  # noqa: BLE001
            logger.error("Failed to initialize APNS client: %s", e, exc_info=True)
            self._client = None

    def send(self, tokens, title, body, data=None):
        """Send APNS notification to the given device tokens.

        Returns list of tokens that failed so they can be deactivated.
        """
        if not tokens:
            logger.warning("APNS send called with empty tokens list")
            return []

        if self._client is None or not self._bundle_id:
            logger.warning(
                "APNS client not initialised or bundle id missing. "
                "Skipping APNS send."
            )
            # treat all as failed so they can be retried / investigated
            return list(tokens)

        try:
            from apns2.payload import Payload  # type: ignore[import-not-found]
        except Exception:  # noqa: BLE001
            logger.warning(
                "apns2 package not installed at send-time; APNS push disabled."
            )
            return list(tokens)

        logger.info(
            "APNS send called with %s token(s), title: '%s', body: '%s'",
            len(tokens),
            title,
            body,
        )

        payload = Payload(alert={"title": title, "body": body}, sound="default", badge=1,
                          custom=data or {})  # type: ignore[arg-type]

        failed_tokens: list[str] = []

        for token in tokens:
            try:
                self._client.send_notification(token, payload, topic=self._bundle_id)  # type: ignore[union-attr]
            except Exception as e:  # noqa: BLE001
                logger.error(
                    "APNS send failed for token %s: %s",
                    token,
                    e,
                    exc_info=True,
                )
                failed_tokens.append(token)

        logger.info(
            "APNS send complete: %s success, %s failure",
            len(tokens) - len(failed_tokens),
            len(failed_tokens),
        )

        return failed_tokens
