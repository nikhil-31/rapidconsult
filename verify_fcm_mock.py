import os
import django
from unittest.mock import MagicMock, patch

# Mock django setup to avoid DB connection
with patch('django.setup'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    import django
    django.setup()

# Now we can import our modules, but we need to mock the models first
# because importing them might trigger DB access or validation
with patch('rapidconsult.users.models.User') as MockUser, \
     patch('rapidconsult.notifications.models.UserDevice') as MockUserDevice:
    
    # We also need to mock firebase_admin before importing providers
    with patch('firebase_admin.initialize_app'), \
         patch('firebase_admin.credentials.Certificate'):
        
        from rapidconsult.notifications.services import send_notification
        from rapidconsult.notifications.providers import FCMNotificationProvider

        def verify_fcm():
            print("Verifying FCM implementation...")

            # Create dummy user and device objects
            user = MagicMock()
            user.username = "test_user"
            
            device = MagicMock()
            device.registration_id = "test_token_123"
            device.type = 'fcm'
            
            # Mock the queryset returned by UserDevice.objects.filter
            mock_queryset = MagicMock()
            mock_queryset.filter.return_value.values_list.return_value = ["test_token_123"]
            MockUserDevice.objects.filter.return_value = mock_queryset

            print(f"User: {user}")
            
            # Mock firebase_admin messaging
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
