# esmsystem/admin.py
from django.contrib import admin
from .models import (
    Shop, Position, Employee, AppUser, Nomenclature,
    IssuanceStandard, Request, RequestItem,
    ProcurementPlan, RequestHistory
)

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['code', 'title']
    search_fields = ['title', 'code']

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['title']
    search_fields = ['title']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'second_name', 'shop', 'position', 'is_active']
    list_filter = ['shop', 'position', 'is_active']
    search_fields = ['last_name', 'first_name', 'second_name']

@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ['login', 'employee', 'shop', 'role']  # Убрали is_active
    list_filter = ['role', 'shop']  # Убрали is_active
    search_fields = ['login', 'employee__last_name']

@admin.register(Nomenclature)
class NomenclatureAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'shelf_life_months', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title']

@admin.register(IssuanceStandard)
class IssuanceStandardAdmin(admin.ModelAdmin):
    list_display = ['nomenclature', 'shop', 'position', 'quantity', 'period_months']
    list_filter = ['shop', 'position']
    search_fields = ['nomenclature__title']

class RequestItemInline(admin.TabularInline):
    model = RequestItem
    extra = 1
    max_num = 10

@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ['request_number', 'shop', 'user', 'status', 'created_at']
    list_filter = ['status', 'shop', 'created_at']
    search_fields = ['request_number', 'shop__title']
    inlines = [RequestItemInline]
    readonly_fields = ['request_number', 'created_at', 'updated_at']

@admin.register(ProcurementPlan)
class ProcurementPlanAdmin(admin.ModelAdmin):
    list_display = ['nomenclature', 'total_quantity', 'planned_month', 'status', 'created_at']
    list_filter = ['status', 'planned_month']
    search_fields = ['nomenclature__title']

@admin.register(RequestHistory)
class RequestHistoryAdmin(admin.ModelAdmin):
    list_display = ['request', 'status_from', 'status_to', 'changed_by', 'created_at']
    list_filter = ['status_to', 'created_at']
    search_fields = ['request__request_number']