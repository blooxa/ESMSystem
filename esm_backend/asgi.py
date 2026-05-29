# esm_backend/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from esmsystem.consumers import RequestConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path('ws/requests/', RequestConsumer.as_asgi()),
        ])
    ),
})