import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                      'esm_backend.settings')  # Измените с ESMSystem.settings на esm_backend.settings
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from esmsystem.models import Request  # Это правильно, если приложение называется ESMSystem


def create_user_groups():
    dept_head_group, created = Group.objects.get_or_create(name='department_head')
    eco_head_group, created = Group.objects.get_or_create(name='economic_head')

    request_ct = ContentType.objects.get_for_model(Request)

    dept_head_group.permissions.set([
        Permission.objects.get(codename='add_request', content_type=request_ct),
        Permission.objects.get(codename='view_request', content_type=request_ct),
    ])

    print("Группы созданы успешно!")


if __name__ == '__main__':
    create_user_groups()