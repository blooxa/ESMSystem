import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as ReportIcon,
  ShoppingCart as OrderIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  Security as SafetyIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { reportsApi } from '../services/api';
import api from '../services/api';
import Layout from './Layout';

const Reports: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Загружаем данные только после определения роли
  useEffect(() => {
    const init = async () => {
      await fetchUserRole();
    };
    init();
  }, []);

  // Загружаем дополнительные данные при изменении роли
  useEffect(() => {
    if (userRole) {
      loadDataByRole();
    }
  }, [userRole]);

  const loadDataByRole = async () => {
    // Для администратора загружаем все данные
    if (userRole === 'admin') {
      await Promise.all([
        fetchEmployees(),
        fetchPositions(),
        fetchUsers()
      ]);
    }
    // Для хоз. отдела и охраны труда загружаем сотрудников и должности
    else if (userRole === 'economic_head' || userRole === 'safety_officer') {
      await Promise.all([
        fetchEmployees(),
        fetchPositions()
      ]);
    }
    // Для остальных - только если нужно
  };

  const fetchUserRole = async () => {
    try {
      const response = await api.get('/users/me/');
      console.log('User data:', response.data);
      const role = response.data.role;
      const username = response.data.username;

      // Определяем роль (учитываем русские и английские названия)
      if (username === 'admin' || role === 'admin' || role === 'администратор' || response.data.is_superuser) {
        setUserRole('admin');
      } else if (role === 'economic_head' || role === 'начальник хоз. отдела') {
        setUserRole('economic_head');
      } else if (role === 'safety_officer' || role === 'охрана труда') {
        setUserRole('safety_officer');
      } else if (role === 'department_head' || role === 'начальник цеха') {
        setUserRole('department_head');
      } else {
        setUserRole('user');
      }

      console.log('Set user role:', userRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  const fetchEmployees = async () => {
    try {
      // Пробуем получить через admin эндпоинт, если нет прав - используем другой
      try {
        const response = await api.get('/admin/employees/get_all_employees/');
        setEmployees(response.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Если нет прав, пробуем получить только сотрудников цеха
          const response = await api.get('/employees/my_shop_employees/');
          setEmployees(response.data);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await api.get('/admin/positions/get_all_positions/');
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/get_all_users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const downloadReport = async (endpoint: string, filename: string) => {
    // Проверяем, нужен ли сотрудник для отчета
    if ((endpoint.includes('employee_ppe_standards') || endpoint.includes('employee_ppe_issues')) && !selectedEmployee) {
      setError('Сначала выберите сотрудника в фильтрах');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Отчет "${filename}" успешно сформирован`);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      if (err.response?.status === 403) {
        setError('У вас нет прав на этот отчет');
      } else if (err.response?.status === 404) {
        setError('Отчет не найден. Проверьте правильность параметров.');
      } else {
        setError('Ошибка при формировании отчета');
      }
    } finally {
      setLoading(false);
    }
  };

  // Функции для разных типов отчетов
  const reportsByRole = {
    admin: [
      {
        category: 'Заявки',
        reports: [
          { title: 'Все заявки', endpoint: '/reports/all_requests/', filename: 'all_requests' },
          { title: 'Заявки по статусам', endpoint: `/reports/requests_by_status/${selectedStatus}/`, filename: `requests_by_status_${selectedStatus}` },
          { title: 'Заявки по пользователям', endpoint: '/reports/requests_by_users/', filename: 'requests_by_users' },
          { title: 'На рассмотрении (Охрана труда)', endpoint: '/reports/pending_safety_requests/', filename: 'pending_safety_requests' },
          { title: 'На рассмотрении (Хоз. отдел)', endpoint: '/reports/pending_economic_requests/', filename: 'pending_economic_requests' },
        ],
      },
      {
        category: 'Сотрудники',
        reports: [
          { title: 'Все сотрудники с размерами', endpoint: '/reports/employees_with_sizes/', filename: 'employees_with_sizes' },
          { title: 'Нормы выдачи СИЗ по сотруднику', endpoint: `/reports/employee_ppe_standards/${selectedEmployee}/`, filename: `employee_ppe_standards` },
          { title: 'Нормы выдачи СИЗ по должности', endpoint: '/reports/position_ppe_standards/', filename: 'position_ppe_standards' },
        ],
      },
      {
        category: 'Выдача СИЗ',
        reports: [
          { title: 'Все выдачи СИЗ', endpoint: '/reports/all_ppe_issues/', filename: 'all_ppe_issues' },
          { title: 'Выдачи СИЗ по сотруднику', endpoint: `/reports/employee_ppe_issues/${selectedEmployee}/`, filename: `employee_ppe_issues` },
          { title: 'Массовая выдача (по нормам)', endpoint: '/reports/mass_issue_report/', filename: 'mass_issue_report' },
        ],
      },
      {
        category: 'Администрирование',
        reports: [
          { title: 'Пользователи системы', endpoint: '/reports/users_report/', filename: 'users_report' },
          { title: 'Цеха', endpoint: '/reports/shops_report/', filename: 'shops_report' },
          { title: 'Должности', endpoint: '/reports/positions_report/', filename: 'positions_report' },
          { title: 'ГОСТ размеры', endpoint: '/reports/sizes_report/', filename: 'sizes_report' },
        ],
      },
    ],
    economic_head: [
      {
        category: 'Заявки',
        reports: [
          { title: 'Все заявки', endpoint: '/reports/all_requests/', filename: 'all_requests' },
          { title: 'Заявки по статусам', endpoint: `/reports/requests_by_status/${selectedStatus}/`, filename: `requests_by_status_${selectedStatus}` },
          { title: 'Заявки по пользователям', endpoint: '/reports/requests_by_users/', filename: 'requests_by_users' },
          { title: 'На рассмотрении (Хоз. отдел)', endpoint: '/reports/pending_economic_requests/', filename: 'pending_economic_requests' },
        ],
      },
      {
        category: 'Сотрудники',
        reports: [
          { title: 'Сотрудники цеха с размерами', endpoint: '/reports/my_shop_employees_with_sizes/', filename: 'my_shop_employees_with_sizes' },
        ],
      },
      {
        category: 'Выдача СИЗ',
        reports: [
          { title: 'Все выдачи СИЗ', endpoint: '/reports/all_ppe_issues/', filename: 'all_ppe_issues' },
          { title: 'Выдачи СИЗ по сотруднику', endpoint: `/reports/employee_ppe_issues/${selectedEmployee}/`, filename: `employee_ppe_issues` },
          { title: 'Массовая выдача (по нормам)', endpoint: '/reports/mass_issue_report/', filename: 'mass_issue_report' },
        ],
      },
    ],
    safety_officer: [
      {
        category: 'Заявки',
        reports: [
          { title: 'Все заявки', endpoint: '/reports/all_requests/', filename: 'all_requests' },
          { title: 'Заявки по статусам', endpoint: `/reports/requests_by_status/${selectedStatus}/`, filename: `requests_by_status_${selectedStatus}` },
          { title: 'Заявки по пользователям', endpoint: '/reports/requests_by_users/', filename: 'requests_by_users' },
          { title: 'На рассмотрении (Охрана труда)', endpoint: '/reports/pending_safety_requests/', filename: 'pending_safety_requests' },
        ],
      },
      {
        category: 'Нормы выдачи',
        reports: [
          { title: 'Нормы выдачи СИЗ по сотруднику', endpoint: `/reports/employee_ppe_standards/${selectedEmployee}/`, filename: `employee_ppe_standards` },
          { title: 'Нормы выдачи СИЗ по должности', endpoint: '/reports/position_ppe_standards/', filename: 'position_ppe_standards' },
        ],
      },
    ],
    department_head: [
      {
        category: 'Мои заявки',
        reports: [
          { title: 'Мои заявки', endpoint: '/reports/my_requests/', filename: 'my_requests' },
          { title: 'Мои заявки по статусам', endpoint: `/reports/my_requests_by_status/${selectedStatus}/`, filename: `my_requests_by_status_${selectedStatus}` },
        ],
      },
      {
        category: 'Сотрудники',
        reports: [
          { title: 'Сотрудники цеха с размерами', endpoint: '/reports/my_shop_employees_with_sizes/', filename: 'my_shop_employees_with_sizes' },
        ],
      },
    ],
    user: [
      {
        category: 'Мои заявки',
        reports: [
          { title: 'Мои заявки', endpoint: '/reports/my_requests/', filename: 'my_requests' },
          { title: 'Мои заявки по статусам', endpoint: `/reports/my_requests_by_status/${selectedStatus}/`, filename: `my_requests_by_status_${selectedStatus}` },
        ],
      },
    ],
  };

  const getReportsForRole = () => {
    if (userRole === 'admin') return reportsByRole.admin;
    if (userRole === 'economic_head') return reportsByRole.economic_head;
    if (userRole === 'safety_officer') return reportsByRole.safety_officer;
    if (userRole === 'department_head') return reportsByRole.department_head;
    return reportsByRole.user;
  };

  const statusOptions = [
    { value: 'all', label: 'Все' },
    { value: 'pending', label: 'На рассмотрении (Охрана труда)' },
    { value: 'hr_approved', label: 'Одобрено охраной труда' },
    { value: 'approved', label: 'Одобрено хоз. отделом' },
    { value: 'rejected', label: 'Отклонена' },
    { value: 'ordered', label: 'Заказ сделан' },
    { value: 'completed', label: 'Выполнена' },
  ];

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return { label: 'Администратор', icon: <AdminIcon />, color: '#f44336' };
      case 'economic_head':
        return { label: 'Начальник хоз. отдела', icon: <OrderIcon />, color: '#9c27b0' };
      case 'safety_officer':
        return { label: 'Охрана труда', icon: <SafetyIcon />, color: '#2196f3' };
      case 'department_head':
        return { label: 'Начальник цеха', icon: <PeopleIcon />, color: '#ff9800' };
      default:
        return { label: 'Пользователь', icon: <PersonIcon />, color: '#4caf50' };
    }
  };

  const roleInfo = getRoleLabel();

  const renderReportButtons = (reports: any[]) => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {reports.map((report, idx) => (
          <Box key={idx} sx={{ flex: '1 1 300px', minWidth: 280 }}>
            <Card sx={{ borderRadius: 2, height: '100%', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {report.title}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={() => downloadReport(report.endpoint, report.filename)}
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 1, bgcolor: '#1976d2' }}
                >
                  Скачать отчет
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Отчеты
            </Typography>
          </Box>
          <Chip
            icon={roleInfo.icon}
            label={roleInfo.label}
            sx={{ bgcolor: `${roleInfo.color}15`, color: roleInfo.color, fontWeight: 500 }}
          />
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Фильтры для отчетов */}
        {(userRole === 'admin' || userRole === 'economic_head' || userRole === 'safety_officer') && (
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Фильтры для отчетов
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Статус заявки</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Статус заявки"
                  >
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(userRole === 'admin' || userRole === 'economic_head' || userRole === 'safety_officer') && (
                  <FormControl sx={{ minWidth: 250 }}>
                    <InputLabel>Сотрудник</InputLabel>
                    <Select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      label="Сотрудник"
                    >
                      <MenuItem value="">-- Выберите сотрудника --</MenuItem>
                      {employees.map(emp => (
                        <MenuItem key={emp.employee_id} value={emp.employee_id}>
                          {emp.full_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Список доступных отчетов */}
        {getReportsForRole().map((category, idx) => (
          <Card key={idx} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReportIcon color="primary" />
                {category.category}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {renderReportButtons(category.reports)}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Layout>
  );
};

export default Reports;