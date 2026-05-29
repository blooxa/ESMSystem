# check_user.py
import os
import sys

sys.path.append(r'C:\Users\irach\PycharmProjects\ESMSystem\esm_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esm_backend.settings')

import django

django.setup()

from esmsystem.models import AppUser, Employee, Shop

print("Проверка данных в базе:\n")

# Проверяем цеха
shops = Shop.objects.all()
print(f"Цеха: {shops.count()}")
for shop in shops:
    print(f"  - ID: {shop.shop_id}, Название: {shop.title}")

# Проверяем сотрудников
employees = Employee.objects.all()
print(f"\nСотрудники: {employees.count()}")
for emp in employees:
    print(f"  - ID: {emp.employee_id}, ФИО: {emp.full_name}")

# Проверяем пользователей
users = AppUser.objects.all()
print(f"\nПользователи: {users.count()}")
for user in users:
    print(f"  - Логин: {user.login}, Роль: {user.role}, Employee ID: {user.employee_id}, Shop ID: {user.shop_id}")

# Если нет пользователя, создаем
if users.count() == 0:
    print("\n⚠️ Нет пользователей! Создаем тестового...")

    if shops.count() > 0 and employees.count() > 0:
        from django.contrib.auth.hashers import make_password

        new_user = AppUser.objects.create(
            employee=employees.first(),
            shop=shops.first(),
            role='admin',
            login='admin',
            password=make_password('admin789')
        )
        print(f"✅ Создан пользователь: {new_user.login} / admin789")
    else:
        print("❌ Нет цехов или сотрудников! Сначала добавьте их.")