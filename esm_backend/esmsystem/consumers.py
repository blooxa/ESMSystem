# esmsystem/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Request


class RequestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_authenticated:
            # Определяем группу для пользователя
            if self.user.groups.filter(name='economic_head').exists():
                self.group_name = 'economic_head_group'
            elif self.user.is_superuser:
                self.group_name = 'admin_group'
            else:
                self.group_name = f'user_{self.user.id}'

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Получение сообщений от клиента
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))

    async def request_update(self, event):
        # Отправка обновлений клиенту
        await self.send(text_data=json.dumps({
            'type': 'request_update',
            'request': event['request']
        }))