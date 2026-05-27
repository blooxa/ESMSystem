# migrate_passwords.py
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from esmsystem.models import AppUser


def migrate_passwords_to_hash():
    """Миграция паролей из открытого вида в хешированный"""
    users_to_update = []

    for user in AppUser.objects.all():
        # Проверяем, не хеширован ли уже пароль
        if not user.password.startswith('pbkdf2_sha256$'):
            print(f"Хеширование пароля для пользователя: {user.login} (было: {user.password[:20]}...)")
            user.password = make_password(user.password)
            users_to_update.append(user)
        else:
            print(f"Пароль для {user.login} уже хеширован")

    if users_to_update:
        AppUser.objects.bulk_update(users_to_update, ['password'])
        print(f"\n✓ Обновлено {len(users_to_update)} пользователей")
    else:
        print("\n✓ Все пароли уже хешированы")


if __name__ == '__main__':
    print("Миграция паролей в хешированный формат...")
    print("-" * 50)
    migrate_passwords_to_hash()