from django.db import models
from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone


class Shop(models.Model):
    shop_id = models.AutoField(primary_key=True, db_column='shopid')
    title = models.CharField(max_length=100, db_column='title')
    code = models.CharField(max_length=10, db_column='code')

    class Meta:
        db_table = 'shops'
        managed = False
        verbose_name = 'Цех'
        verbose_name_plural = 'Цеха'

    def __str__(self):
        return f"{self.code} - {self.title}"


class Position(models.Model):
    position_id = models.AutoField(primary_key=True, db_column='positionid')
    title = models.CharField(max_length=100, db_column='title')

    class Meta:
        db_table = 'positions'
        managed = False
        verbose_name = 'Должность'
        verbose_name_plural = 'Должности'

    def __str__(self):
        return self.title


class Employee(models.Model):
    employee_id = models.AutoField(primary_key=True, db_column='employeeid')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, db_column='shopid')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, db_column='positionid')
    first_name = models.CharField(max_length=50, db_column='firstname')
    second_name = models.CharField(max_length=50, db_column='secondname')
    last_name = models.CharField(max_length=50, db_column='lastname')
    is_active = models.BooleanField(db_column='isactive')
    hire_date = models.DateField(db_column='hiredate')

    # Антропометрические данные
    gender = models.CharField(max_length=1, null=True, blank=True, db_column='gender')
    heightcm = models.IntegerField(null=True, blank=True, db_column='heightcm')
    clothing_size = models.CharField(max_length=10, null=True, blank=True, db_column='clothingsize')
    shoesize = models.IntegerField(null=True, blank=True, db_column='shoesize')
    headsize = models.IntegerField(null=True, blank=True, db_column='headsize')
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, db_column='weight')

    class Meta:
        db_table = 'employees'
        managed = False
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.second_name}".strip()

    @property
    def height(self):
        return self.heightcm

    @height.setter
    def height(self, value):
        self.heightcm = value

    def __str__(self):
        return self.full_name


class AppUser(models.Model):
    user_id = models.AutoField(primary_key=True, db_column='userid')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_column='employeeid')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, db_column='shopid')
    role = models.CharField(max_length=50, db_column='role')
    login = models.CharField(max_length=50, unique=True, db_column='login')
    password = models.CharField(max_length=128, db_column='password')

    class Meta:
        db_table = 'users'
        managed = False
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.login


class Nomenclature(models.Model):
    nomenclature_id = models.AutoField(primary_key=True, db_column='nomenclatureid')
    title = models.CharField(max_length=200, db_column='title')
    unit = models.CharField(max_length=50, db_column='unit')
    shelf_life_months = models.IntegerField(db_column='shelflifemonths')
    is_active = models.BooleanField(db_column='isactive')

    class Meta:
        db_table = 'nomenclatures'
        managed = False
        verbose_name = 'Номенклатура'
        verbose_name_plural = 'Номенклатуры'

    def __str__(self):
        return f"{self.title} ({self.unit})"


class PPEIssueStandard(models.Model):
    """Норма выдачи СИЗ для должности"""
    standard_id = models.AutoField(primary_key=True, db_column='standardid')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, db_column='positionid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantity', default=1)
    period_months = models.IntegerField(db_column='period_months', default=12)
    is_active = models.BooleanField(db_column='isactive', default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdat')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedat')

    class Meta:
        db_table = 'ppe_issue_standards'
        verbose_name = 'Норма выдачи СИЗ'
        verbose_name_plural = 'Нормы выдачи СИЗ'
        unique_together = [['position', 'nomenclature']]

    def __str__(self):
        return f"{self.position.title} - {self.nomenclature.title}: {self.quantity} {self.nomenclature.unit} / {self.period_months} мес."


class PPEIssueRecord(models.Model):
    """Фактическая выдача СИЗ сотруднику"""
    issue_id = models.AutoField(primary_key=True, db_column='issueid')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_column='employeeid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    issue_date = models.DateField(db_column='issuedate')
    size = models.CharField(max_length=20, db_column='size', blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantity')
    next_issue_date = models.DateField(db_column='nextissuedate')
    issued_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, db_column='issuedby')
    comment = models.TextField(blank=True, null=True, db_column='comment')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdat')

    class Meta:
        db_table = 'ppe_issue_records'
        verbose_name = 'Выдача СИЗ'
        verbose_name_plural = 'Выдачи СИЗ'

    def __str__(self):
        return f"{self.employee.full_name} - {self.nomenclature.title} - {self.issue_date}"


class IssuanceStandard(models.Model):
    issuance_standard_id = models.AutoField(primary_key=True, db_column='issuancestandardid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, db_column='shopid')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, db_column='positionid')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantity')
    period_months = models.IntegerField(db_column='period_months')

    class Meta:
        db_table = 'issuancestandards'
        managed = False
        verbose_name = 'Норма выдачи'
        verbose_name_plural = 'Нормы выдачи'

    def __str__(self):
        return f"{self.nomenclature.title} - {self.shop.code}"

class Request(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении (Охрана труда)'),
        ('hr_approved', 'Одобрено охраной труда'),
        ('approved', 'Одобрено хоз. отделом'),
        ('ordered', 'Заказ сделан'),
        ('partially_delivered', 'Частично доставлено'),
        ('delivered', 'Доставлено на склад'),
        ('partially_issued', 'Частично выдано'),
        ('completed', 'Выполнена'),
        ('rejected', 'Отклонена'),
        ('cancelled', 'Отозвана'),
    ]

    request_id = models.AutoField(primary_key=True, db_column='requestid')
    request_number = models.CharField(max_length=20, unique=True, db_column='requestnumber')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, db_column='shopid')
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, db_column='userid')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_column='status')
    comment = models.TextField(blank=True, null=True, db_column='comment')
    created_at = models.DateTimeField(default=timezone.now, db_column='createdat')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedat')

    title = models.CharField(max_length=200, default='', db_column='title')
    description = models.TextField(default='', db_column='description')
    quantity = models.IntegerField(default=1, db_column='quantity')
    unit = models.CharField(max_length=50, default='шт', db_column='unit')
    supplier_name = models.CharField(max_length=200, blank=True, null=True, db_column='suppliername')
    order_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, db_column='orderprice')
    order_date = models.DateTimeField(blank=True, null=True, db_column='orderdate')

    class Meta:
        db_table = 'requests'
        managed = False
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'

    def __str__(self):
        return f"{self.request_number}"


class RequestItem(models.Model):
    item_id = models.AutoField(primary_key=True, db_column='itemid')
    request = models.ForeignKey(Request, on_delete=models.CASCADE, db_column='requestid', related_name='items')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    quantity_requested = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantityrequested')
    standard_title = models.CharField(max_length=50, db_column='standardtitle')
    standard_unit = models.CharField(max_length=50, db_column='standardtnit')

    class Meta:
        db_table = 'requestitems'
        managed = False
        verbose_name = 'Позиция заявки'
        verbose_name_plural = 'Позиции заявок'

    def __str__(self):
        return f"{self.request.request_number} - {self.nomenclature.title}"


class RequestHistory(models.Model):
    history_id = models.AutoField(primary_key=True, db_column='history_id')
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='history', db_column='request_id')
    status_from = models.CharField(max_length=20, blank=True, null=True, db_column='status_from')
    status_to = models.CharField(max_length=20, db_column='status_to')
    changed_by = models.ForeignKey(DjangoUser, on_delete=models.CASCADE, db_column='changed_by_id')
    comment = models.TextField(blank=True, db_column='comment')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')

    class Meta:
        db_table = 'requesthistory'
        managed = False
        verbose_name = 'История заявки'
        verbose_name_plural = 'История заявок'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request.request_number} - {self.status_from} -> {self.status_to}"


class RequestEmployee(models.Model):
    request_employee_id = models.AutoField(primary_key=True, db_column='requestemployeeid')
    request = models.ForeignKey(Request, on_delete=models.CASCADE, db_column='requestid', related_name='employees')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_column='employeeid')
    height = models.IntegerField(db_column='height', null=True, blank=True)

    class Meta:
        db_table = 'request_employees'
        managed = False
        verbose_name = 'Сотрудник в заявке'
        verbose_name_plural = 'Сотрудники в заявках'


class RequestEmployeeItem(models.Model):
    item_id = models.AutoField(primary_key=True, db_column='itemid')
    request_employee = models.ForeignKey(RequestEmployee, on_delete=models.CASCADE, db_column='requestemployeeid',
                                         related_name='items')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    size = models.CharField(max_length=20, db_column='size')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantity')

    class Meta:
        db_table = 'request_employee_items'
        managed = False
        verbose_name = 'СИЗ сотрудника в заявке'
        verbose_name_plural = 'СИЗ сотрудников в заявках'


# ГОСТ размеры - только один раз!
class ClothingSizeGOST(models.Model):
    size_id = models.AutoField(primary_key=True)
    gender = models.CharField(max_length=1, null=True, blank=True)
    size_code = models.CharField(max_length=10, null=True, blank=True)
    size_name = models.CharField(max_length=50, null=True, blank=True)
    height_min = models.IntegerField(null=True, blank=True)
    height_max = models.IntegerField(null=True, blank=True)
    chest_circumference = models.IntegerField(null=True, blank=True)
    waist_circumference = models.IntegerField(null=True, blank=True)
    hip_circumference = models.IntegerField(null=True, blank=True)
    sort_order = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'clothingsizegost'
        managed = False
        verbose_name = 'ГОСТ размер одежды'
        verbose_name_plural = 'ГОСТ размеры одежды'


class FootwearSizeGOST(models.Model):
    size_id = models.AutoField(primary_key=True)
    size_ru = models.IntegerField(null=True, blank=True)
    size_eu = models.IntegerField(null=True, blank=True)
    size_us = models.IntegerField(null=True, blank=True)
    foot_length_min = models.IntegerField(null=True, blank=True)
    foot_length_max = models.IntegerField(null=True, blank=True)
    sort_order = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'footwearsizegost'
        managed = False
        verbose_name = 'ГОСТ размер обуви'
        verbose_name_plural = 'ГОСТ размеры обуви'


class HeadwearSizeGOST(models.Model):
    size_id = models.AutoField(primary_key=True)
    size_code = models.CharField(max_length=10, null=True, blank=True)
    head_circumference_min = models.IntegerField(null=True, blank=True)
    head_circumference_max = models.IntegerField(null=True, blank=True)
    sort_order = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'headwearsizegost'
        managed = False
        verbose_name = 'ГОСТ размер головного убора'
        verbose_name_plural = 'ГОСТ размеры головных уборов'
class ProcurementPlan(models.Model):
    procurement_plan_id = models.AutoField(primary_key=True, db_column='procurementplanid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    total_quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='totalquantity')
    planned_month = models.IntegerField(db_column='plannedmonth')
    status = models.CharField(max_length=30, db_column='status')
    created_at = models.DateTimeField(default=timezone.now, db_column='createdat')

    class Meta:
        db_table = 'procurementplans'
        managed = False
        verbose_name = 'План закупок'
        verbose_name_plural = 'Планы закупок'

    def __str__(self):
        return f"{self.nomenclature.title} - {self.planned_month}"
class ProcurementPlan(models.Model):
    procurement_plan_id = models.AutoField(primary_key=True, db_column='procurementplanid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    total_quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='totalquantity')
    planned_month = models.IntegerField(db_column='plannedmonth')
    status = models.CharField(max_length=30, db_column='status')
    created_at = models.DateTimeField(default=timezone.now, db_column='createdat')

    class Meta:
        db_table = 'procurementplans'
        managed = False
        verbose_name = 'План закупок'
        verbose_name_plural = 'Планы закупок'

    def __str__(self):
        return f"{self.nomenclature.title} - {self.planned_month}"


class PPEIssue(models.Model):
    """Выдача СИЗ сотруднику"""
    issue_id = models.AutoField(primary_key=True, db_column='issueid')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_column='employeeid')
    nomenclature = models.ForeignKey(Nomenclature, on_delete=models.CASCADE, db_column='nomenclatureid')
    issue_date = models.DateField(db_column='issuedate')
    size = models.CharField(max_length=20, db_column='size', blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantity')
    next_issue_date = models.DateField(db_column='nextissuedate')

    class Meta:
        db_table = 'ppe_issues'
        managed = False
        verbose_name = 'Выдача СИЗ'
        verbose_name_plural = 'Выдачи СИЗ'

    def __str__(self):
        return f"{self.employee.full_name} - {self.nomenclature.title} - {self.issue_date}"