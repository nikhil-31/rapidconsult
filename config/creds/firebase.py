import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings

cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)

default_app = firebase_admin.initialize_app(cred)
