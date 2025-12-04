import os
import sys
from unittest.mock import MagicMock, patch

# Set dummy env vars to satisfy settings
os.environ["DATABASE_URL"] = "postgres://user:pass@localhost:5432/db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.local"
os.environ["DJANGO_READ_DOT_ENV_FILE"] = "False"
os.environ["USE_SPACES"] = "False"

# Mock django setup
with patch('django.setup'):
    import django
    django.setup()

# Mock modules in sys.modules to prevent actual imports
sys.modules['rapidconsult.users.models'] = MagicMock()
sys.modules['rapidconsult.notifications.models'] = MagicMock()
sys.modules['firebase_admin'] = MagicMock()
sys.modules['firebase_admin.credentials'] = MagicMock()
sys.modules['firebase_admin.messaging'] = MagicMock()

from rapidconsult.notifications.services import send_notification

def verify_fcm():
    print("Verifying FCM implementation...")

    # Create dummy user and device objects
    user = MagicMock()
    user.username = "test_user"
    
    # Mock UserDevice model
    UserDevice = sys.modules['rapidconsult.notifications.models'].UserDevice
    
    # Mock the queryset returned by UserDevice.objects.filter
    mock_queryset = MagicMock()
    mock_queryset.filter.return_value.values_list.return_value = ["test_token_123"]
    UserDevice.objects.filter.return_value = mock_queryset

    # Patch messaging in providers module
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
            
            # Verify MulticastMessage was called with correct args
            if mock_messaging.MulticastMessage.called:
                print("SUCCESS: messaging.MulticastMessage was called.")
                call_args = mock_messaging.MulticastMessage.call_args
                kwargs = call_args[1]
                print(f"MulticastMessage kwargs: {kwargs}")
                
                if kwargs.get('tokens') == ['test_token_123']:
                    print("VERIFICATION PASSED: Tokens match.")
                else:
                    print("VERIFICATION FAILED: Tokens do not match.")
                
                # Verify Notification was called
                if mock_messaging.Notification.called:
                     print("SUCCESS: messaging.Notification was called.")
                     notif_call_args = mock_messaging.Notification.call_args
                     notif_kwargs = notif_call_args[1]
                     print(f"Notification kwargs: {notif_kwargs}")
                     
                     if notif_kwargs.get('title') == "Test Title" and notif_kwargs.get('body') == "Test Body":
                         print("VERIFICATION PASSED: Notification content matches.")
                     else:
                         print("VERIFICATION FAILED: Notification content does not match.")
                else:
                     print("VERIFICATION FAILED: messaging.Notification was NOT called.")

            else:
                print("VERIFICATION FAILED: messaging.MulticastMessage was NOT called.")

        else:
            print("VERIFICATION FAILED: messaging.send_multicast was NOT called.")

if __name__ == "__main__":
    verify_fcm()
