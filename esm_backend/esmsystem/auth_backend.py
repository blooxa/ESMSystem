# esmsystem/auth_backend.py
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User as DjangoUser
from .models import AppUser


class CustomAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Ищем пользователя в таблице users (без поля is_active)
            app_user = AppUser.objects.filter(login=username).first()

            if not app_user:
                print(f"User not found: {username}")
                return None

            print(f"User found: {username}")
            print(f"Stored password: {app_user.password[:20]}...")

            # Проверяем пароль
            password_valid = check_password(password, app_user.password)

            if password_valid:
                # Создаем или получаем пользователя Django
                django_user, created = DjangoUser.objects.get_or_create(
                    username=app_user.login,
                    defaults={
                        'email': f"{app_user.login}@esmsystem.ru",
                        'first_name': app_user.employee.first_name if app_user.employee else '',
                        'last_name': app_user.employee.last_name if app_user.employee else '',
                        'is_active': True,
                        'is_staff': app_user.role == 'admin',
                        'is_superuser': app_user.role == 'admin',
                    }
                )
                print(f"Authentication successful for: {username}")
                return django_user
            else:
                print(f"Invalid password for: {username}")
                return None

        except Exception as e:
            print(f"Authentication error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def get_user(self, user_id):
        try:
            return DjangoUser.objects.get(pk=user_id)
        except DjangoUser.DoesNotExist:
            return None