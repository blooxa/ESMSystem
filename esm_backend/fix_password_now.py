# fix_password_fixed.py
import os
import sys

sys.path.append(r'C:\Users\irach\PycharmProjects\ESMSystem\esm_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')

import django

django.setup()

from django.contrib.auth.hashers import make_password
from esmsystem.models import AppUser

# Находим пользователя
user = AppUser.objects.filter(login='admin').first()

if user:
    print(f"Старый пароль: {user.password}")
    # Хешируем пароль
    hashed = make_password('admin789')
    user.password = hashed
    user.save()
    print(f"Новый хеш: {user.password}")
    print("✅ Пароль успешно захэширован!")

    # Проверяем
    from django.contrib.auth.hashers import check_password

    if check_password('admin789', user.password):
        print("✅ Проверка пароля успешна!")
    else:
        print("❌ Ошибка проверки пароля!")
else:
    print("❌ Пользователь не найден")