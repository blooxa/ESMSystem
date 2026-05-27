from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from esmsystem.views import (
    RequestViewSet, UserViewSet, simple_auth, PPEViewSet,
    FullRequestViewSet, EconomicReportViewSet,
    AdminUserViewSet, AdminShopViewSet, AdminEmployeeViewSet,
    AdminPositionViewSet, AdminSizeStandardViewSet,
    EmployeeViewSet, SafetyStandardViewSet, PPEIssueViewSet,
    NomenclatureViewSet, NomenclatureAdminViewSet, MassIssueViewSet, ReportsViewSet
)

def home(request):
    return HttpResponse("""
        <h1>ESM System API</h1>
        <p>Доступные маршруты:</p>
        <ul>
            <li><a href='/admin/'>/admin/</a> - Админ-панель</li>
            <li><a href='/api/requests/'>/api/requests/</a> - Заявки</li>
            <li><a href='/api/users/'>/api/users/</a> - Пользователи</li>
            <li><a href='/api-token-auth/'>/api-token-auth/</a> - Получение токена</li>
        </ul>
    """)

router = DefaultRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'users', UserViewSet, basename='user')
router.register(r'ppe', PPEViewSet, basename='ppe')
router.register(r'full-requests', FullRequestViewSet, basename='full-request')
router.register(r'reports', EconomicReportViewSet, basename='report')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/shops', AdminShopViewSet, basename='admin-shops')
router.register(r'admin/employees', AdminEmployeeViewSet, basename='admin-employees')
router.register(r'admin/positions', AdminPositionViewSet, basename='admin-positions')
router.register(r'admin/sizes', AdminSizeStandardViewSet, basename='admin-sizes')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'safety/standards', SafetyStandardViewSet, basename='safety-standards')
#router.register(r'safety/issues', SafetyPPEIssueViewSet, basename='safety-issues') Добавьте или измените регистрацию:
router.register(r'nomenclatures', NomenclatureViewSet, basename='nomenclature')
router.register(r'safety/nomenclatures', NomenclatureAdminViewSet, basename='safety-nomenclatures')
router.register(r'ppe-issues', PPEIssueViewSet, basename='ppe-issues')
router.register(r'mass-issue', MassIssueViewSet, basename='mass-issue')
router.register(r'reports', ReportsViewSet, basename='reports')

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('api-auth/', include('rest_framework.urls')),
    path('api/simple-auth/', simple_auth, name='simple_auth'),

path('api/reports/all_requests/', ReportsViewSet.as_view({'get': 'all_requests'}), name='reports-all_requests'),
    path('api/reports/requests_by_status/<str:status>/', ReportsViewSet.as_view({'get': 'requests_by_status'}), name='reports-requests_by_status'),
    path('api/reports/requests_by_users/', ReportsViewSet.as_view({'get': 'requests_by_users'}), name='reports-requests_by_users'),
    path('api/reports/pending_safety_requests/', ReportsViewSet.as_view({'get': 'pending_safety_requests'}), name='reports-pending_safety_requests'),
    path('api/reports/pending_economic_requests/', ReportsViewSet.as_view({'get': 'pending_economic_requests'}), name='reports-pending_economic_requests'),
    path('api/reports/my_requests/', ReportsViewSet.as_view({'get': 'my_requests'}), name='reports-my_requests'),
    path('api/reports/my_requests_by_status/<str:status>/', ReportsViewSet.as_view({'get': 'my_requests_by_status'}), name='reports-my_requests_by_status'),
    path('api/reports/employees_with_sizes/', ReportsViewSet.as_view({'get': 'employees_with_sizes'}), name='reports-employees_with_sizes'),
    path('api/reports/my_shop_employees_with_sizes/', ReportsViewSet.as_view({'get': 'my_shop_employees_with_sizes'}), name='reports-my_shop_employees_with_sizes'),
    path('api/reports/employee_ppe_standards/<str:employee_id>/', ReportsViewSet.as_view({'get': 'employee_ppe_standards'}), name='reports-employee_ppe_standards'),
    path('api/reports/position_ppe_standards/', ReportsViewSet.as_view({'get': 'position_ppe_standards'}), name='reports-position_ppe_standards'),
    path('api/reports/all_ppe_issues/', ReportsViewSet.as_view({'get': 'all_ppe_issues'}), name='reports-all_ppe_issues'),
    path('api/reports/employee_ppe_issues/<str:employee_id>/', ReportsViewSet.as_view({'get': 'employee_ppe_issues'}), name='reports-employee_ppe_issues'),
    path('api/reports/mass_issue_report/', ReportsViewSet.as_view({'get': 'mass_issue_report'}), name='reports-mass_issue_report'),
    path('api/reports/users_report/', ReportsViewSet.as_view({'get': 'users_report'}), name='reports-users_report'),
    path('api/reports/shops_report/', ReportsViewSet.as_view({'get': 'shops_report'}), name='reports-shops_report'),
    path('api/reports/positions_report/', ReportsViewSet.as_view({'get': 'positions_report'}), name='reports-positions_report'),
    path('api/reports/sizes_report/', ReportsViewSet.as_view({'get': 'sizes_report'}), name='reports-sizes_report'),

]
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  # Стандартный бэкенд
    'esmsystem.auth_backend.CustomAuthBackend',  # Ваш кастомный бэкенд
]
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}