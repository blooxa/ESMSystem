#!/usr/bin/env python
"""Скрипт для создания пользователей в системе ESM"""
import os
import sys
import django

# Добавляем путь к проекту
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Указываем настройки Django (обратите внимание: esm_backend.settings, а не settings)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')

# Инициализируем Django
django.setup()

from django.contrib.auth.hashers import make_password, check_password
from esmsystem.models import AppUser, Employee, Shop, Position


def create_users():
    """Создание пользователей в системе"""

    # Создаем цех если его нет
    shop, shop_created = Shop.objects.get_or_create(
        shop_id=1,
        defaults={'title': 'Основной цех', 'code': 'MAIN'}
    )
    if shop_created:
        print(f"✓ Создан цех: {shop.title}")
    else:
        print(f"✓ Найден цех: {shop.title} ({shop.code})")

    # Создаем должность "Начальник цеха"
    position_head, _ = Position.objects.get_or_create(
        title='Начальник цеха',
        defaults={'title': 'Начальник цеха'}
    )
    print(f"✓ Должность: {position_head.title}")

    # Создаем должность "Сотрудник"
    position_worker, _ = Position.objects.get_or_create(
        title='Сотрудник',
        defaults={'title': 'Сотрудник'}
    )
    print(f"✓ Должность: {position_worker.title}")

    # Создаем сотрудника для Администратора
    admin_employee, _ = Employee.objects.get_or_create(
        first_name='Администратор',
        last_name='Администраторов',
        defaults={
            'shop': shop,
            'position': position_head,
            'second_name': 'Администраторович',
            'is_active': True,
            'hire_date': '2024-01-01'
        }
    )
    print(f"✓ Сотрудник: {admin_employee.full_name}")

    # Создаем пользователя Администратора
    admin_user, admin_created = AppUser.objects.get_or_create(
        login='admin',
        defaults={
            'employee': admin_employee,
            'shop': shop,
            'role': 'admin',
            'password': make_password('admin789')
        }
    )
    if not admin_created:
        admin_user.password = make_password('admin789')
        admin_user.save()
        print(f"✓ Обновлен пароль для: admin")
    else:
        print(f"✓ Создан admin (пароль: admin789)")

    # Создаем сотрудника для Начальника цеха
    head_employee, _ = Employee.objects.get_or_create(
        first_name='Петр',
        last_name='Петров',
        defaults={
            'shop': shop,
            'position': position_head,
            'second_name': 'Петрович',
            'is_active': True,
            'hire_date': '2024-01-01'
        }
    )
    print(f"✓ Сотрудник: {head_employee.full_name}")

    # Создаем пользователя Начальника цеха
    head_user, head_created = AppUser.objects.get_or_create(
        login='head',
        defaults={
            'employee': head_employee,
            'shop': shop,
            'role': 'department_head',
            'password': make_password('head123')
        }
    )
    if not head_created:
        head_user.password = make_password('head123')
        head_user.save()
        print(f"✓ Обновлен пароль для: head")
    else:
        print(f"✓ Создан head (пароль: head123)")

    # Создаем сотрудника для Хозяйственного отдела
    eco_employee, _ = Employee.objects.get_or_create(
        first_name='Екатерина',
        last_name='Смирнова',
        defaults={
            'shop': shop,
            'position': position_worker,
            'second_name': 'Алексеевна',
            'is_active': True,
            'hire_date': '2024-01-01'
        }
    )
    print(f"✓ Сотрудник: {eco_employee.full_name}")

    # Создаем пользователя Хозяйственного отдела
    eco_user, eco_created = AppUser.objects.get_or_create(
        login='economic',
        defaults={
            'employee': eco_employee,
            'shop': shop,
            'role': 'economic_head',
            'password': make_password('economic123')
        }
    )
    if not eco_created:
        eco_user.password = make_password('economic123')
        eco_user.save()
        print(f"✓ Обновлен пароль для: economic")
    else:
        print(f"✓ Создан economic (пароль: economic123)")

    # Создаем обычного сотрудника
    worker_employee, _ = Employee.objects.get_or_create(
        first_name='Алексей',
        last_name='Алексеев',
        defaults={
            'shop': shop,
            'position': position_worker,
            'second_name': 'Алексеевич',
            'is_active': True,
            'hire_date': '2024-03-01'
        }
    )
    print(f"✓ Сотрудник: {worker_employee.full_name}")

    # Создаем обычного пользователя
    worker_user, worker_created = AppUser.objects.get_or_create(
        login='user',
        defaults={
            'employee': worker_employee,
            'shop': shop,
            'role': 'user',
            'password': make_password('user789')
        }
    )
    if not worker_created:
        worker_user.password = make_password('user789')
        worker_user.save()
        print(f"✓ Обновлен пароль для: user")
    else:
        print(f"✓ Создан user (пароль: user789)")

    # Проверка паролей
    print("\n" + "=" * 50)
    print("ПРОВЕРКА ПАРОЛЕЙ:")
    print("=" * 50)

    test_users = [
        ('admin', 'admin789'),
        ('head', 'head123'),
        ('economic', 'economic123'),
        ('user', 'user789'),
    ]

    for login, password in test_users:
        try:
            user = AppUser.objects.get(login=login)
            is_valid = check_password(password, user.password)
            status = "✓ РАБОТАЕТ" if is_valid else "✗ НЕ РАБОТАЕТ"
            print(f"{login}: {status}")
        except AppUser.DoesNotExist:
            print(f"{login}: ✗ НЕ НАЙДЕН")

    print("\n" + "=" * 50)
    print("ГОТОВО! Используйте эти данные для входа:")
    print("=" * 50)
    print("| Логин     | Пароль      | Роль                 |")
    print("|-----------|-------------|----------------------|")
    print("| admin     | admin789    | Администратор        |")
    print("| head      | head123     | Начальник цеха       |")
    print("| economic  | economic123 | Хозяйственный отдел  |")
    print("| user      | user789     | Пользователь         |")
    print("=" * 50)


if __name__ == '__main__':
    print("Создание пользователей в системе ESM...")
    print("-" * 50)
    create_users()