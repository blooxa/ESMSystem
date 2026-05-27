import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../services/api';
import Layout from './Layout';

interface Employee {
  employee_id: number;
  full_name: string;
  position_name: string;
  shop_name?: string;
  gender?: string;
  heightcm?: number;
  clothing_size?: string;
  shoesize?: number;
  headsize?: number;
}

interface PPEIssue {
  issue_id: number;
  employee_id: number;
  employee_name: string;
  position_name: string;
  shop_name: string;
  nomenclature_id: number;
  nomenclature_title: string;
  unit: string;
  size: string;
  quantity: number;
  issue_date: string;
  next_issue_date: string;
  days_until_next: number;
  status: string;
  color: string;
  status_text: string;
  issued_by: string;
  comment: string;
}

interface SizeOption {
  value: string;
  label: string;
  description?: string;
}

const PPEIssues: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeIssues, setEmployeeIssues] = useState<PPEIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [clothingSizes, setClothingSizes] = useState<SizeOption[]>([]);
  const [footwearSizes, setFootwearSizes] = useState<SizeOption[]>([]);
  const [headwearSizes, setHeadwearSizes] = useState<SizeOption[]>([]);
  const [selectedSizeOptions, setSelectedSizeOptions] = useState<SizeOption[]>([]);

  const [newIssue, setNewIssue] = useState({
    employee_id: '',
    nomenclature_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    size: '',
    quantity: 1,
    period_months: 12,
    comment: '',
  });

  // Загрузка размеров для СИЗ
  const fetchSizes = async () => {
    try {
      const [clothingRes, footwearRes, headwearRes] = await Promise.all([
        api.get('/api/admin/sizes/by-type-gender/?size_type=clothing'),
        api.get('/api/admin/sizes/by-type-gender/?size_type=footwear'),
        api.get('/api/admin/sizes/by-type-gender/?size_type=headwear'),
      ]);

      setClothingSizes(clothingRes.data.map((s: any) => ({
        value: s.size_code,
        label: `${s.size_code}`,
        description: `Рост: ${s.height_min || '?'}-${s.height_max || '?'} см, Грудь: ${s.chest_circumference || '?'} см`,
      })));

      setFootwearSizes(footwearRes.data.map((s: any) => ({
        value: s.size_ru.toString(),
        label: `${s.size_ru}`,
        description: `EU: ${s.size_eu || '?'}, Длина стопы: ${s.foot_length_min || '?'}-${s.foot_length_max || '?'} мм`,
      })));

      setHeadwearSizes(headwearRes.data.map((s: any) => ({
        value: s.size_code,
        label: `${s.size_code}`,
        description: `Обхват головы: ${s.head_circumference_min || '?'}-${s.head_circumference_max || '?'} см`,
      })));
    } catch (err) {
      console.error('Error fetching sizes:', err);
    }
  };

  // Определение типа СИЗ и получение соответствующих размеров
  const getSizeOptionsForNomenclature = (nomenclatureTitle: string): SizeOption[] => {
    const title_lower = nomenclatureTitle.toLowerCase();

    // Жидкости и сыпучие - размер не нужен
    const noSizeKeywords = ['жидкость', 'раствор', 'гель', 'спрей', 'пена', 'мазь', 'крем', 'паста'];
    if (noSizeKeywords.some(kw => title_lower.includes(kw))) {
      return [];
    }

    // Обувь
    if (title_lower.includes('обув') || title_lower.includes('сапог') || title_lower.includes('ботин') || title_lower.includes('туфель')) {
      // Фильтруем размеры обуви по полу сотрудника
      if (selectedEmployee?.gender === 'F') {
        return footwearSizes.filter(s => parseInt(s.value) <= 41);
      }
      return footwearSizes;
    }

    // Головные уборы
    if (title_lower.includes('каск') || title_lower.includes('шлем') || title_lower.includes('шапк') || title_lower.includes('кепк')) {
      return headwearSizes;
    }

    // Одежда
    return clothingSizes;
  };

  // Автоматический подбор рекомендуемого размера
  const getRecommendedSize = (nomenclatureTitle: string): string => {
    const title_lower = nomenclatureTitle.toLowerCase();

    if (!selectedEmployee) return '';

    // Обувь
    if (title_lower.includes('обув') || title_lower.includes('сапог') || title_lower.includes('ботин')) {
      if (selectedEmployee.shoesize) {
        return selectedEmployee.shoesize.toString();
      }
      return selectedEmployee.gender === 'F' ? '38' : '42';
    }

    // Головные уборы
    if (title_lower.includes('каск') || title_lower.includes('шлем') || title_lower.includes('шапк')) {
      if (selectedEmployee.headsize) {
        return selectedEmployee.headsize.toString();
      }
      return '58';
    }

    // Одежда
    if (selectedEmployee.clothing_size) {
      return selectedEmployee.clothing_size;
    }
    if (selectedEmployee.heightcm) {
      const height = selectedEmployee.heightcm;
      if (height < 166) return '88';
      if (height < 174) return '96';
      if (height < 182) return '104';
      return '112';
    }
    return selectedEmployee.gender === 'F' ? '88' : '100';
  };

  // Загрузка списка сотрудников
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ppe/get_available_employees/');
      let data = response.data;

      if (data && data.results) {
        data = data.results;
      }
      if (data && data.data) {
        data = data.data;
      }

      if (Array.isArray(data)) {
        setEmployees(data);
        setFilteredEmployees(data);
      } else {
        console.error('Employees data is not an array:', data);
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка выдач для конкретного сотрудника
  const fetchEmployeeIssues = async (employeeId: number) => {
    setIssuesLoading(true);
    try {
      const response = await api.get(`/api/ppe-issues/get_employee_issues/?employee_id=${employeeId}`);
      let data = response.data;

      if (data && data.results) {
        data = data.results;
      }
      if (data && data.data) {
        data = data.data;
      }

      if (Array.isArray(data)) {
        setEmployeeIssues(data);
      } else {
        setEmployeeIssues([]);
      }
    } catch (err: any) {
      console.error('Error fetching employee issues:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки выдач СИЗ');
      setEmployeeIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchNomenclatures = async () => {
    try {
      const response = await api.get('/api/nomenclatures/');
      let data = response.data;

      if (data && data.results) {
        data = data.results;
      }
      if (data && data.data) {
        data = data.data;
      }

      if (Array.isArray(data)) {
        setNomenclatures(data);
      } else {
        setNomenclatures([]);
      }
    } catch (err) {
      console.error('Error fetching nomenclatures:', err);
      setNomenclatures([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchNomenclatures();
    fetchSizes();
  }, []);

  useEffect(() => {
    let filtered = [...employees];
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (emp.shop_name && emp.shop_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  // Обновление размеров при выборе СИЗ
  useEffect(() => {
    if (newIssue.nomenclature_id) {
      const selectedNomenclature = nomenclatures.find(n => n.nomenclature_id === Number(newIssue.nomenclature_id));
      if (selectedNomenclature) {
        const sizeOptions = getSizeOptionsForNomenclature(selectedNomenclature.title);
        setSelectedSizeOptions(sizeOptions);

        // Автоматически подставляем рекомендуемый размер
        const recommendedSize = getRecommendedSize(selectedNomenclature.title);
        if (recommendedSize && sizeOptions.some(opt => opt.value === recommendedSize)) {
          setNewIssue(prev => ({ ...prev, size: recommendedSize }));
        } else if (sizeOptions.length > 0) {
          setNewIssue(prev => ({ ...prev, size: sizeOptions[0].value }));
        } else {
          setNewIssue(prev => ({ ...prev, size: '' }));
        }
      }
    } else {
      setSelectedSizeOptions([]);
    }
  }, [newIssue.nomenclature_id, nomenclatures, selectedEmployee]);

  const handleEmployeeClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    // Автоматически подставляем employee_id при открытии диалога добавления
    setNewIssue(prev => ({ ...prev, employee_id: employee.employee_id.toString() }));
    await fetchEmployeeIssues(employee.employee_id);
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
    setEmployeeIssues([]);
    setNewIssue(prev => ({ ...prev, employee_id: '' }));
  };

  const handleAddIssue = async () => {
    if (!newIssue.employee_id || !newIssue.nomenclature_id || !newIssue.issue_date) {
      setError('Заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/ppe-issues/create_issue/', newIssue);
      setSuccess('Выдача успешно зарегистрирована');
      setAddDialogOpen(false);
      setNewIssue({
        employee_id: selectedEmployee?.employee_id.toString() || '',
        nomenclature_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        size: '',
        quantity: 1,
        period_months: 12,
        comment: '',
      });
      setSelectedSizeOptions([]);
      // Обновляем список выдач для текущего сотрудника
      if (selectedEmployee) {
        await fetchEmployeeIssues(selectedEmployee.employee_id);
      }
      await fetchEmployees();
    } catch (err: any) {
      console.error('Error creating issue:', err);
      setError(err.response?.data?.error || 'Ошибка создания выдачи');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: string, statusText: string, daysUntilNext: number) => {
    let chipProps = {};

    if (daysUntilNext <= 0) {
      chipProps = { color: 'error', icon: <WarningIcon /> };
    } else if (daysUntilNext <= 60) {
      chipProps = { color: 'error', icon: <WarningIcon /> };
    } else if (daysUntilNext <= 150) {
      chipProps = { color: 'warning', icon: <WarningIcon /> };
    } else {
      chipProps = { color: 'success', icon: <CheckCircleIcon /> };
    }

    return <Chip {...chipProps} label={statusText} size="small" />;
  };

  const getStatusColor = (daysUntilNext: number): string => {
    if (daysUntilNext <= 0) return '#f44336';
    if (daysUntilNext <= 60) return '#f44336';
    if (daysUntilNext <= 150) return '#ff9800';
    return '#4caf50';
  };

  const handleExportCSV = () => {
    const headers = [
      'Сотрудник',
      'Должность',
      'Цех',
      'СИЗ',
      'Размер',
      'Количество',
      'Ед. изм.',
      'Дата выдачи',
      'Дата следующей выдачи',
      'Статус',
      'Комментарий',
    ];

    const rows = employeeIssues.map((issue) => [
      issue.employee_name,
      issue.position_name,
      issue.shop_name,
      issue.nomenclature_title,
      issue.size,
      issue.quantity,
      issue.unit,
      new Date(issue.issue_date).toLocaleDateString('ru-RU'),
      new Date(issue.next_issue_date).toLocaleDateString('ru-RU'),
      issue.status_text,
      issue.issued_by,
      issue.comment,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `employee_${selectedEmployee?.full_name}_issues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Если выбран сотрудник - показываем его СИЗ
  if (selectedEmployee) {
    return (
      <Layout>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Кнопка назад */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <IconButton onClick={handleBackToList} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Выдача СИЗ: {selectedEmployee.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedEmployee.position_name} | {selectedEmployee.shop_name || 'Цех не указан'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ bgcolor: '#4caf50' }}
            >
              Записать выдачу
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              disabled={employeeIssues.length === 0}
            >
              Экспорт CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchEmployeeIssues(selectedEmployee.employee_id)}
            >
              Обновить
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Легенда */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Индикация сроков замены СИЗ
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: '#4caf50' }} />
                  <Typography variant="body2">Более 5 месяцев - зеленый (срок не истек)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: '#ff9800' }} />
                  <Typography variant="body2">До 5 месяцев - желтый (скоро замена)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: '#f44336' }} />
                  <Typography variant="body2">Менее 2 месяцев - красный (требуется выдача)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Антропометрические данные сотрудника */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Антропометрические данные</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Рост</Typography>
                  <Typography variant="body1">{selectedEmployee.heightcm || 'Не указан'} см</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Размер одежды</Typography>
                  <Typography variant="body1">{selectedEmployee.clothing_size || 'Не указан'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Размер обуви</Typography>
                  <Typography variant="body1">{selectedEmployee.shoesize || 'Не указан'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Размер головы</Typography>
                  <Typography variant="body1">{selectedEmployee.headsize || 'Не указан'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Таблица выдач СИЗ */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>История выдачи СИЗ</Typography>
              {issuesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#fafafa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Кол-во</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Дата выдачи</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>След. выдача</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeIssues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <Typography color="text.secondary">Нет данных о выдачах СИЗ для этого сотрудника</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeeIssues.map((issue) => {
                          const bgColor = getStatusColor(issue.days_until_next);
                          return (
                            <TableRow
                              key={issue.issue_id}
                              hover
                              sx={{
                                '& td': { borderLeft: `4px solid ${bgColor}` },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {issue.nomenclature_title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={issue.size || 'Не указан'} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {issue.quantity} {issue.unit}
                              </TableCell>
                              <TableCell>
                                {new Date(issue.issue_date).toLocaleDateString('ru-RU')}
                              </TableCell>
                              <TableCell>
                                <Tooltip title={issue.status_text}>
                                  <span>
                                    {new Date(issue.next_issue_date).toLocaleDateString('ru-RU')}
                                  </span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                {getStatusChip(issue.status, issue.status_text, issue.days_until_next)}
                              </TableCell>
                              <TableCell>{issue.issued_by}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Диалог добавления выдачи */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Регистрация выдачи СИЗ - {selectedEmployee.full_name}
              </Typography>
              <IconButton onClick={() => setAddDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>СИЗ *</InputLabel>
                <Select
                  value={newIssue.nomenclature_id}
                  onChange={(e) => setNewIssue({ ...newIssue, nomenclature_id: e.target.value })}
                  label="СИЗ *"
                >
                  {nomenclatures.map((nom) => (
                    <MenuItem key={nom.nomenclature_id} value={nom.nomenclature_id}>
                      {nom.title} ({nom.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Дата выдачи *"
                type="date"
                fullWidth
                required
                value={newIssue.issue_date}
                onChange={(e) => setNewIssue({ ...newIssue, issue_date: e.target.value })}
                slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
              />

              {/* Поле размера с выпадающим списком */}
              {selectedSizeOptions.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Размер</InputLabel>
                  <Select
                    value={newIssue.size}
                    onChange={(e) => setNewIssue({ ...newIssue, size: e.target.value })}
                    label="Размер"
                  >
                    {selectedSizeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Box>
                          <Typography variant="body2">{opt.label}</Typography>
                          {opt.description && (
                            <Typography variant="caption" color="text.secondary">
                              {opt.description}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Если размер не нужен (жидкости) - показываем информационное сообщение */}
              {selectedSizeOptions.length === 0 && newIssue.nomenclature_id && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Для данного СИЗ размер не указывается
                </Alert>
              )}

              <TextField
                label="Количество"
                type="number"
                fullWidth
                value={newIssue.quantity}
                onChange={(e) => setNewIssue({ ...newIssue, quantity: parseFloat(e.target.value) })}
                slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
              />

              <TextField
                label="Срок службы (месяцев)"
                type="number"
                fullWidth
                value={newIssue.period_months}
                onChange={(e) => setNewIssue({ ...newIssue, period_months: parseInt(e.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 60 } }}
                helperText="Через сколько месяцев требуется выдать СИЗ снова"
              />

              <TextField
                label="Комментарий"
                fullWidth
                multiline
                rows={3}
                value={newIssue.comment}
                onChange={(e) => setNewIssue({ ...newIssue, comment: e.target.value })}
                placeholder="Дополнительная информация о выдаче"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={handleAddIssue}
              variant="contained"
              disabled={submitting || !newIssue.nomenclature_id || !newIssue.issue_date}
              sx={{ bgcolor: '#4caf50' }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Зарегистрировать выдачу'}
            </Button>
          </DialogActions>
        </Dialog>
      </Layout>
    );
  }

  // Список сотрудников (основной вид)
  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Выдача СИЗ
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEmployees}
          >
            Обновить список
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Поиск */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Поиск по фамилии, должности, цеху..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#999' }} fontSize="small" />,
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Список сотрудников */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Список сотрудников</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {filteredEmployees.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">Сотрудники не найдены</Typography>
                  </Box>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <React.Fragment key={employee.employee_id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#f5f5f5' },
                        }}
                        onClick={() => handleEmployeeClick(employee)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#1976d2' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {employee.full_name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Должность: {employee.position_name}
                              </Typography>
                              {employee.shop_name && (
                                <Typography variant="caption" color="text.secondary">
                                  Цех: {employee.shop_name}
                                </Typography>
                              )}
                              {employee.clothing_size && (
                                <Typography variant="caption" color="text.secondary">
                                  Размер одежды: {employee.clothing_size}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton edge="end">
                          <InventoryIcon color="action" />
                        </IconButton>
                      </ListItem>
                      {index < filteredEmployees.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                )}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default PPEIssues;