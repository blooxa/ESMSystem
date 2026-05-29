import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Grid,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { ppeApi, employeesApi, requestsApi } from '../services/api';
import api from '../services/api';
import Layout from './Layout';

interface Employee {
  employee_id: number;
  full_name: string;
  position_name: string;
  gender: string;
  heightcm: number;
  clothing_size: string;
  shoesize: number;
  headsize: number;
  shop_name?: string;
}

interface PPEStandard {
  nomenclature_id: number;
  nomenclature_title: string;
  unit: string;
  standard_quantity: number;
  period_months: number;
  last_issue_date: string | null;
  next_issue_date: string | null;
  days_until_next: number | null;
  can_order: boolean;
  status: 'expired' | 'critical' | 'warning' | 'good' | 'not_issued';
  status_color: string;
  status_text: string;
}

interface PPEHistory {
  issue_id: number;
  issue_date: string;
  nomenclature_title: string;
  size: string;
  quantity: number;
  next_issue_date: string;
  unit: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [ppeStandards, setPpeStandards] = useState<PPEStandard[]>([]);
  const [ppeHistory, setPpeHistory] = useState<PPEHistory[]>([]);
  const [ppeLoading, setPpeLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [user, setUser] = useState<{ role: string; is_superuser: boolean }>({ role: '', is_superuser: false });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/users/me/');
      setUser({ role: response.data.role, is_superuser: response.data.is_superuser });
      fetchEmployees(response.data.role, response.data.is_superuser);
    } catch (err) {
      console.error('Error fetching user info:', err);
      fetchEmployees('', false);
    }
  };

  const fetchEmployees = async (userRole?: string, isSuperuser?: boolean) => {
    try {
      setLoading(true);
      let response;

      // Если админ - загружаем всех сотрудников
      if (isSuperuser || userRole === 'admin') {
        response = await api.get('/api/admin/employees/get_all_employees/');
      } else {
        // Иначе - только сотрудников цеха
        response = await employeesApi.getMyShopEmployees();
      }

      let data = response.data;
      if (data && data.results) data = data.results;
      if (data && data.data) data = data.data;

      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeePPE = async (employeeId: number) => {
    setPpeLoading(true);
    try {
      const response = await ppeApi.getEmployeePPE(employeeId);
      const today = new Date();

      const standardsWithDates = response.data.map((item: any) => {
        let lastIssueDate = item.last_issue_date ? new Date(item.last_issue_date) : null;
        let nextIssueDate = null;
        let daysUntilNext = null;
        let status = 'not_issued';
        let status_color = '#9e9e9e';
        let status_text = 'Не выдавалось';

        if (lastIssueDate) {
          nextIssueDate = new Date(lastIssueDate);
          nextIssueDate.setMonth(nextIssueDate.getMonth() + item.period_months);
          daysUntilNext = Math.ceil((nextIssueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

          if (daysUntilNext <= 0) {
            status = 'expired';
            status_color = '#f44336';
            status_text = 'СРОЧНО! Требуется замена';
          } else if (daysUntilNext <= 60) {
            status = 'critical';
            status_color = '#f44336';
            status_text = `Срочно! Осталось ${daysUntilNext} дн.`;
          } else if (daysUntilNext <= 150) {
            status = 'warning';
            status_color = '#ff9800';
            status_text = `Скоро замена, осталось ${daysUntilNext} дн.`;
          } else {
            status = 'good';
            status_color = '#4caf50';
            status_text = `Срок не истек, осталось ${daysUntilNext} дн.`;
          }
        }

        return {
          ...item,
          last_issue_date: item.last_issue_date,
          next_issue_date: nextIssueDate ? nextIssueDate.toISOString().split('T')[0] : null,
          days_until_next: daysUntilNext,
          status: status,
          status_color: status_color,
          status_text: status_text,
        };
      });

      setPpeStandards(standardsWithDates);
    } catch (err) {
      console.error('Error fetching PPE standards:', err);
    } finally {
      setPpeLoading(false);
    }
  };

  const fetchEmployeeHistory = async (employeeId: number) => {
    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/ppe-issues/get_employee_issues/?employee_id=${employeeId}`);
      let data = response.data;
      if (data && data.results) data = data.results;
      if (data && data.data) data = data.data;
      setPpeHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching PPE history:', err);
      setPpeHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    fetchEmployeePPE(employee.employee_id);
    fetchEmployeeHistory(employee.employee_id);
    setTabValue(1);
  };

  const handleShowHistory = (employee: Employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeHistory(employee.employee_id);
    setHistoryDialogOpen(true);
  };

  const getStatusChip = (status: string, statusText: string, color: string) => {
    let chipColor: 'error' | 'warning' | 'success' | 'default' = 'default';
    if (status === 'expired' || status === 'critical') chipColor = 'error';
    else if (status === 'warning') chipColor = 'warning';
    else if (status === 'good') chipColor = 'success';

    return <Chip label={statusText} color={chipColor} size="small" />;
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Управление сотрудниками
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} onClick={() => fetchEmployees(user.role, user.is_superuser)} variant="outlined">
            Обновить
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label="Сотрудники" />
          <Tab label="Нормы выдачи СИЗ" disabled={!selectedEmployee} />
        </Tabs>

        {/* Вкладка сотрудников */}
        {tabValue === 0 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ФИО</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Должность</TableCell>
                      {(user.is_superuser || user.role === 'admin') && (
                        <TableCell sx={{ fontWeight: 600 }}>Цех</TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 600 }}>Пол</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Рост (см)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Размер одежды</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Размер обуви</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Размер головы</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">
                            {user.is_superuser || user.role === 'admin'
                              ? 'Нет сотрудников в системе'
                              : 'Нет сотрудников в вашем цехе'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => (
                        <TableRow key={emp.employee_id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {emp.full_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{emp.position_name}</TableCell>
                          {(user.is_superuser || user.role === 'admin') && (
                            <TableCell>{emp.shop_name || '-'}</TableCell>
                          )}
                          <TableCell>
                            <Chip
                              label={emp.gender === 'M' ? 'Мужской' : emp.gender === 'F' ? 'Женский' : '-'}
                              size="small"
                              variant="outlined"
                              icon={<PersonIcon />}
                            />
                          </TableCell>
                          <TableCell>{emp.heightcm || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.clothing_size || '-'}
                              size="small"
                              color={emp.clothing_size ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={emp.shoesize || '-'}
                              size="small"
                              color={emp.shoesize ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={emp.headsize || '-'}
                              size="small"
                              color={emp.headsize ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Просмотр норм выдачи">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEmployeeSelect(emp)}
                                  sx={{ color: '#1976d2' }}
                                >
                                  <InventoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Вкладка норм выдачи СИЗ */}
        {tabValue === 1 && selectedEmployee && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedEmployee.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEmployee.position_name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
                  <Chip
                    label={`Рост: ${selectedEmployee.heightcm || '-'} см`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Размер одежды: ${selectedEmployee.clothing_size || '-'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Размер обуви: ${selectedEmployee.shoesize || '-'}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Легенда цветов */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Индикация сроков замены СИЗ:</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label="Более 5 месяцев - зеленый" size="small" sx={{ bgcolor: '#4caf50', color: '#fff' }} />
                  <Chip label="До 5 месяцев - желтый" size="small" sx={{ bgcolor: '#ff9800', color: '#fff' }} />
                  <Chip label="Менее 2 месяцев - красный" size="small" sx={{ bgcolor: '#f44336', color: '#fff' }} />
                </Box>
              </Paper>

              <Divider sx={{ mb: 3 }} />

              {ppeLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#fafafa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Норма</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Период</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Последняя выдача</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Следующая выдача</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ppeStandards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <Typography color="text.secondary">
                              Нет норм выдачи для этой должности
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        ppeStandards.map((item) => (
                          <TableRow
                            key={item.nomenclature_id}
                            hover
                            sx={{
                              '& td': { borderLeft: `4px solid ${item.status_color}` },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.nomenclature_title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.standard_quantity} {item.unit}
                            </TableCell>
                            <TableCell>
                              {item.period_months} мес.
                            </TableCell>
                            <TableCell>
                              {item.last_issue_date
                                ? new Date(item.last_issue_date).toLocaleDateString('ru-RU')
                                : 'Не выдавалось'}
                            </TableCell>
                            <TableCell>
                              <Tooltip title={item.status_text}>
                                <span>
                                  {item.next_issue_date
                                    ? new Date(item.next_issue_date).toLocaleDateString('ru-RU')
                                    : '-'}
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.status_text}
                                size="small"
                                sx={{
                                  bgcolor: item.status_color,
                                  color: '#fff',
                                  '& .MuiChip-icon': { color: '#fff' }
                                }}
                                icon={item.status === 'good' ? <CheckCircleIcon /> :
                                      item.status === 'warning' ? <WarningIcon /> :
                                      item.status === 'critical' || item.status === 'expired' ? <WarningIcon /> : undefined}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Диалог истории выдач */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              История выдач СИЗ - {selectedEmployee?.full_name}
            </Typography>
            <IconButton onClick={() => setHistoryDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : ppeHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <HistoryIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography color="text.secondary">
                Нет записей о выдачах СИЗ для этого сотрудника
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Дата выдачи</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Количество</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Следующая выдача</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ppeHistory.map((record) => (
                    <TableRow key={record.issue_id} hover>
                      <TableCell>
                        {new Date(record.issue_date).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {record.nomenclature_title}
                        </Typography>
                      </TableCell>
                      <TableCell>{record.size || '-'}</TableCell>
                      <TableCell>{record.quantity} {record.unit}</TableCell>
                      <TableCell>
                        {new Date(record.next_issue_date).toLocaleDateString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)} variant="outlined">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default EmployeeManagement;