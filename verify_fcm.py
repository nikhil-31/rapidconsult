import os
import django
from unittest.mock import MagicMock, patch

import environ
env = environ.Env()
# reading .env file
environ.Env.read_env(env_file='/Users/nikhilb/pycharmprojects/rapidconsult/.env')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
django.setup()

from rapidconsult.users.models import User
from rapidconsult.notifications.models import UserDevice
from rapidconsult.notifications.services import send_notification
from rapidconsult.notifications.providers import FCMNotificationProvider

def verify_fcm():
    print("Verifying FCM implementation...")

    # Create a dummy user
    user, created = User.objects.get_or_create(username="test_fcm_user", email="test_fcm@example.com")
    
    # Create a dummy device
    device, created = UserDevice.objects.get_or_create(
        user=user,
        registration_id="test_token_123",
        defaults={'type': 'fcm', 'active': True}
    )
    
    print(f"User: {user}")
    print(f"Device: {device}")

    # Mock firebase_admin
    with patch('rapidconsult.notifications.providers.messaging') as mock_messaging:
        # Mock response
        mock_response = MagicMock()
        mock_response.failure_count = 0
        mock_messaging.send_multicast.return_value = mock_response

        # Send notification
        print("Sending notification...")
        send_notification(user, "Test Title", "Test Body", {"key": "value"})

        # Verify call
        if mock_messaging.send_multicast.called:
            print("SUCCESS: messaging.send_multicast was called.")
            call_args = mock_messaging.send_multicast.call_args
            message = call_args[0][0]
            print(f"Message tokens: {message.tokens}")
            print(f"Message notification: {message.notification.title} - {message.notification.body}")
            
            if message.tokens == ['test_token_123'] and message.notification.title == "Test Title":
                 print("VERIFICATION PASSED: Arguments match.")
            else:
                 print("VERIFICATION FAILED: Arguments do not match.")
        else:
            print("VERIFICATION FAILED: messaging.send_multicast was NOT called.")

if __name__ == "__main__":
    verify_fcm()
