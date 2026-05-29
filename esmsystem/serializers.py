from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Request, RequestHistory, AppUser, Shop, Employee, Nomenclature


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser']


class RequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            'request_id', 'request_number', 'title', 'description',
            'quantity', 'unit', 'status', 'status_display', 'comment',
            'created_at', 'created_at_formatted', 'updated_at',
            'supplier_name', 'order_price', 'order_date',
            'requester_name', 'shop_id', 'shop_name'
        ]

    def get_shop_name(self, obj):
        return obj.shop.title if obj.shop else ''

    def get_requester_name(self, obj):
        if obj.user and obj.user.employee:
            return obj.user.employee.full_name
        return obj.user.login if obj.user else ''

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M') if obj.created_at else ''


class RequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['title', 'description', 'quantity', 'unit']


class RequestApproveSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)


class RequestOrderSerializer(serializers.Serializer):
    supplier_name = serializers.CharField(max_length=200)
    order_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    comment = serializers.CharField(required=False, allow_blank=True)


class RequestHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RequestHistory
        fields = ['id', 'status_from', 'status_to', 'changed_by_name', 'comment', 'created_at']

    def get_changed_by_name(self, obj):
        return obj.changed_by.username if obj.changed_by else ''


class EmployeePPEItemSerializer(serializers.Serializer):
    """СИЗ для сотрудника"""
    nomenclature_id = serializers.IntegerField()
    nomenclature_title = serializers.CharField(read_only=True)
    size = serializers.CharField(max_length=20)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    standard_quantity = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    last_issue_date = serializers.DateField(read_only=True, allow_null=True)
    can_order = serializers.BooleanField(read_only=True)


class EmployeePPERequestSerializer(serializers.Serializer):
    """Сотрудник с его СИЗ в заявке"""
    employee_id = serializers.IntegerField()
    employee_name = serializers.CharField(read_only=True)
    position_name = serializers.CharField(read_only=True)
    height = serializers.IntegerField(required=False, allow_null=True)
    items = EmployeePPEItemSerializer(many=True)


class FullRequestCreateSerializer(serializers.Serializer):
    """Полный сериализатор для создания заявки с сотрудниками"""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    employees = EmployeePPERequestSerializer(many=True)

    def validate(self, data):
        for emp in data['employees']:
            if not emp['items']:
                raise serializers.ValidationError(
                    f"Для сотрудника {emp.get('employee_id')} не выбрано ни одного СИЗа"
                )
        return data


class NomenclatureSerializer(serializers.ModelSerializer):
    """Сериализатор для номенклатуры СИЗ"""
    class Meta:
        model = Nomenclature
        fields = ['nomenclature_id', 'title', 'unit', 'shelf_life_months', 'is_active']