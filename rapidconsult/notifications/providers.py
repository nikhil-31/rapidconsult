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
        
        if cred_path:
            try:
                # Handle Path objects
                if hasattr(cred_path, '__fspath__'):
                    cred_path = str(cred_path)
                elif hasattr(cred_path, '__str__'):
                    cred_path = str(cred_path)
                
                # Check if file exists
                import os
                if not os.path.exists(cred_path):
                    logger.warning(f"Firebase credentials file not found at {cred_path}. FCM will not work.")
                    return
                
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK initialized successfully with credentials from {cred_path}")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK: {e}", exc_info=True)
        else:
            logger.warning("Neither FCM_CREDENTIALS nor FIREBASE_SERVICE_ACCOUNT_PATH found in settings. FCM will not work.")

    def send(self, tokens, title, body, data=None):
        if not tokens:
            return

        # Try to initialize if not already initialized (lazy initialization for multi-process environments)
        if not firebase_admin._apps:
            self._initialize_firebase()
        
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
