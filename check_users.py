# check_users.py (положите в ту же папку, что и manage.py)
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')
django.setup()

from esmsystem.models import AppUser
from django.contrib.auth.hashers import check_password

print("="*50)
print("ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ В БАЗЕ ДАННЫХ")
print("="*50)

users = AppUser.objects.all()
if not users:
    print("❌ Нет пользователей в базе данных!")
else:
    for user in users:
        print(f"\n📋 Логин: {user.login}")
        print(f"   Роль: {user.role}")
        print(f"   Сотрудник: {user.employee.full_name if user.employee else 'Нет'}")
        print(f"   Цех: {user.shop.title if user.shop else 'Нет'}")
        print(f"   Тип пароля: {'Хешированный' if user.password.startswith('pbkdf2_sha256$') else 'Открытый'}")
        print(f"   Длина пароля: {len(user.password)} символов")

print("\n" + "="*50)
print("ТЕСТ ВХОДА:")
print("="*50)

test_credentials = [
    ('admin', 'admin789'),
    ('head', 'head123'),
    ('economic', 'economic123'),
    ('user', 'user789'),
]

for username, password in test_credentials:
    try:
        user = AppUser.objects.get(login=username)
        if check_password(password, user.password):
            print(f"✅ {username}: вход выполнен успешно")
        else:
            print(f"❌ {username}: неверный пароль")
    except AppUser.DoesNotExist:
        print(f"❌ {username}: пользователь не найден")