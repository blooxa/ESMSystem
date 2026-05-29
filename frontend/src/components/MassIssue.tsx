import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Straighten as StraightenIcon,
  Accessibility as AccessibilityIcon,
  Inventory as InventoryIcon,
  RemoveCircle as RemoveCircleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import api from '../services/api';
import Layout from './Layout';

interface Employee {
  employee_id: number;
  full_name: string;
  position_name: string;
  gender?: string;
  heightcm?: number;
  clothing_size?: string;
  shoesize?: number;
  headsize?: number;
  shop_name?: string;
}

interface IssueItem {
  nomenclature_id: number;
  nomenclature_title: string;
  unit: string;
  standard_quantity: number;
  period_months: number;
  last_issue_date: string | null;
  can_issue: boolean;
  recommended_size: string;
  selected_size: string;
  selected_quantity: number;
}

interface EmployeeWithItems {
  employee_id: number;
  full_name: string;
  position_name: string;
  gender?: string;
  height: number | null;
  clothing_size?: string;
  shoesize?: number;
  headsize?: number;
  items: IssueItem[];
  selected: boolean;
}

const MassIssue: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithItems[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectAll, setSelectAll] = useState(false);
  const [issueResults, setIssueResults] = useState<any[]>([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);

  // Загрузка списка сотрудников
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ppe/get_available_employees/');
      let data = response.data;

      if (data && data.results) data = data.results;
      if (data && data.data) data = data.data;

      if (Array.isArray(data)) {
        setAvailableEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Ошибка при загрузке списка сотрудников');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка норм для сотрудника
  const fetchEmployeeStandards = async (employeeId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/mass-issue/get_employee_standards/?employee_id=${employeeId}`);
      const employee = availableEmployees.find(e => e.employee_id === employeeId);
      const items = response.data;

      if (employee) {
        setEmployees(prev => [...prev, {
          employee_id: employeeId,
          full_name: employee.full_name,
          position_name: employee.position_name,
          gender: employee.gender,
          height: employee.heightcm || null,
          clothing_size: employee.clothing_size,
          shoesize: employee.shoesize,
          headsize: employee.headsize,
          items: items,
          selected: true,
        }]);
      }
    } catch (error) {
      console.error('Error fetching standards:', error);
      setError('Ошибка при загрузке норм выдачи');
    } finally {
      setLoading(false);
      setSelectedEmployee('');
    }
  };

  const removeEmployee = (employeeId: number) => {
    setEmployees(prev => prev.filter(e => e.employee_id !== employeeId));
  };

  const removeEmployeeItem = (employeeId: number, nomenclatureId: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employee_id === employeeId) {
        return {
          ...emp,
          items: emp.items.filter(item => item.nomenclature_id !== nomenclatureId),
        };
      }
      return emp;
    }));
  };

  const toggleEmployeeSelection = (employeeId: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employee_id === employeeId) {
        return { ...emp, selected: !emp.selected };
      }
      return emp;
    }));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setEmployees(prev => prev.map(emp => ({ ...emp, selected: newSelectAll })));
  };

  const updateEmployeeItem = (
    employeeId: number,
    nomenclatureId: number,
    field: 'selected_size' | 'selected_quantity',
    value: string | number
  ) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employee_id === employeeId) {
        return {
          ...emp,
          items: emp.items.map(item => {
            if (item.nomenclature_id === nomenclatureId) {
              return { ...item, [field]: value };
            }
            return item;
          }),
        };
      }
      return emp;
    }));
  };

  const handleSubmit = async () => {
    const selectedEmployees = employees.filter(emp => emp.selected);

    if (selectedEmployees.length === 0) {
      setError('Выберите хотя бы одного сотрудника для выдачи');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const requestData = {
        issue_date: issueDate,
        employees: selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          items: emp.items
            .filter(item => item.selected_quantity > 0)
            .map(item => ({
              nomenclature_id: item.nomenclature_id,
              selected_size: item.selected_size,
              selected_quantity: item.selected_quantity,
              period_months: item.period_months,
              comment: `Массовая выдача по нормам`,
            })),
        })),
      };

      const response = await api.post('/mass-issue/mass_issue/', requestData);

      // Сохраняем результаты выдачи
      if (response.data.results) {
        setIssueResults(response.data.results);
        setResultsDialogOpen(true);
      }

      setSuccess(`Успешно выдано! ${response.data.message}`);

      // Проверяем, есть ли данные о заявке в localStorage
      const savedData = localStorage.getItem('mass_issue_from_request');
      if (savedData) {
        try {
          const requestDataFromStorage = JSON.parse(savedData);
          const requestId = requestDataFromStorage.request_id;

          if (requestId) {
            await api.post(`/requests/${requestId}/complete/`, {
              comment: 'СИЗ выданы в рамках массовой выдачи'
            });
            console.log(`Request ${requestId} status updated to completed`);
            localStorage.setItem('mass_issue_completed', 'true');
          }
        } catch (completeError) {
          console.error('Error updating request status:', completeError);
        } finally {
          localStorage.removeItem('mass_issue_from_request');
        }
      }

      setEmployees([]);
      setSelectAll(false);
      setIssueDate(new Date().toISOString().split('T')[0]);

      await fetchEmployees();
    } catch (error: any) {
      console.error('Error during mass issue:', error);
      setError(error.response?.data?.error || 'Ошибка при массовой выдаче');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableEmployeesList = () => {
    const addedIds = employees.map(e => e.employee_id);
    return availableEmployees.filter(e => !addedIds.includes(e.employee_id));
  };

  const getSizeTypeIcon = (title: string) => {
    const title_lower = title.toLowerCase();
    if (title_lower.includes('обув') || title_lower.includes('сапог') || title_lower.includes('ботин')) {
      return <StraightenIcon fontSize="small" />;
    }
    if (title_lower.includes('каск') || title_lower.includes('шлем') || title_lower.includes('шапк')) {
      return <AccessibilityIcon fontSize="small" />;
    }
    return <AccessibilityIcon fontSize="small" />;
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Загрузка данных из заявки для массовой выдачи
  useEffect(() => {
    const savedData = localStorage.getItem('mass_issue_from_request');
    if (savedData) {
      try {
        const requestData = JSON.parse(savedData);
        console.log('Loading mass issue from request:', requestData);

        if (requestData.employees && requestData.employees.length > 0) {
          const employeesWithItems: EmployeeWithItems[] = requestData.employees.map((emp: any) => ({
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            position_name: emp.position_name,
            gender: emp.gender,
            height: emp.height,
            clothing_size: emp.clothing_size,
            shoesize: emp.shoesize,
            headsize: emp.headsize,
            selected: true,
            items: emp.items.map((item: any) => ({
              nomenclature_id: item.nomenclature_id,
              nomenclature_title: item.nomenclature_title,
              unit: item.unit,
              standard_quantity: item.quantity,
              period_months: item.period_months || 12,
              last_issue_date: null,
              can_issue: true,
              recommended_size: item.size || '',
              selected_size: item.size || '',
              selected_quantity: item.quantity,
            })),
          }));
          setEmployees(employeesWithItems);
        }
      } catch (error) {
        console.error('Error loading mass issue data:', error);
      }
    }
  }, []);

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Массовая выдача СИЗ
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Дата выдачи"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                sx={{ width: 200 }}
                slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
              />
              <FormControl sx={{ minWidth: 250, flex: 1 }}>
                <InputLabel>Выберите сотрудника</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value as number)}
                  label="Выберите сотрудника"
                >
                  {getAvailableEmployeesList().map(emp => (
                    <MenuItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} - {emp.position_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => selectedEmployee && fetchEmployeeStandards(selectedEmployee as number)}
                disabled={!selectedEmployee || loading}
                startIcon={<AddIcon />}
              >
                Добавить сотрудника
              </Button>
            </Box>

            {employees.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={selectAll} onChange={toggleSelectAll} />}
                  label="Выбрать всех сотрудников для выдачи"
                />
              </Box>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {employees.map(emp => (
              <Accordion key={emp.employee_id} sx={{ mb: 2 }} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Checkbox
                        checked={emp.selected}
                        onChange={() => toggleEmployeeSelection(emp.employee_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{emp.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.position_name}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {emp.clothing_size && <Chip label={`Одежда: ${emp.clothing_size}`} size="small" variant="outlined" />}
                      {emp.shoesize && <Chip label={`Обувь: ${emp.shoesize}`} size="small" variant="outlined" />}
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeEmployee(emp.employee_id); }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon fontSize="small" color="info" />
                      Антропометрические данные
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <TextField label="Рост (см)" type="number" value={emp.height || ''} size="small" sx={{ width: 150 }} disabled />
                      <TextField label="Размер одежды" value={emp.clothing_size || ''} size="small" sx={{ width: 150 }} disabled />
                      <TextField label="Размер обуви" value={emp.shoesize || ''} size="small" sx={{ width: 150 }} disabled />
                      <TextField label="Размер головы" value={emp.headsize || ''} size="small" sx={{ width: 150 }} disabled />
                    </Box>
                  </Paper>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">Список СИЗ для выдачи</Typography>
                    {emp.items.some(item => {
                      const today = new Date();
                      const lastIssue = item.last_issue_date ? new Date(item.last_issue_date) : null;
                      if (lastIssue) {
                        const nextDate = new Date(lastIssue);
                        nextDate.setMonth(nextDate.getMonth() + item.period_months);
                        return nextDate <= today;
                      }
                      return false;
                    }) && (
                      <Chip
                        icon={<WarningIcon />}
                        label="Требуется замена"
                        size="small"
                        color="error"
                      />
                    )}
                  </Box>

                  {emp.items.map(item => {
                    // Расчет статуса выдачи
                    let itemStatus = '';
                    let itemStatusColor = '';
                    let isExpired = false;
                    if (item.last_issue_date) {
                      const lastDate = new Date(item.last_issue_date);
                      const nextDate = new Date(lastDate);
                      nextDate.setMonth(nextDate.getMonth() + item.period_months);
                      const today = new Date();
                      const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      if (daysLeft <= 0) {
                        itemStatus = 'Требуется замена';
                        itemStatusColor = '#f44336';
                        isExpired = true;
                      } else if (daysLeft <= 60) {
                        itemStatus = `Срочно! Осталось ${daysLeft} дн.`;
                        itemStatusColor = '#ff9800';
                      }
                    }

                    return (
                      <Box
                        key={item.nomenclature_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          flexWrap: { xs: 'wrap', sm: 'nowrap' },
                          border: '1px solid',
                          borderColor: isExpired ? '#ffcdd2' : '#e0e0e0',
                          bgcolor: isExpired ? '#ffebee' : 'transparent',
                          position: 'relative'
                        }}
                      >
                        <Box sx={{ flex: 2, minWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getSizeTypeIcon(item.nomenclature_title)}
                            {item.nomenclature_title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Норма: {item.standard_quantity} {item.unit} / {item.period_months} мес.
                          </Typography>
                          {item.last_issue_date && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'warning.main' }}>
                              Последняя выдача: {new Date(item.last_issue_date).toLocaleDateString('ru-RU')}
                            </Typography>
                          )}
                          {itemStatus && (
                            <Chip
                              label={itemStatus}
                              size="small"
                              sx={{ mt: 0.5, bgcolor: itemStatusColor, color: '#fff', height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          <Typography variant="caption" sx={{ display: 'block', color: 'primary.main' }}>
                            Рекомендуемый размер: {item.recommended_size}
                          </Typography>
                        </Box>

                        <TextField
                          label="Размер"
                          size="small"
                          value={item.selected_size}
                          onChange={(e) => updateEmployeeItem(emp.employee_id, item.nomenclature_id, 'selected_size', e.target.value)}
                          sx={{ width: 140 }}
                          placeholder={item.recommended_size}
                        />

                        <TextField
                          label="Кол-во"
                          type="number"
                          size="small"
                          value={item.selected_quantity}
                          onChange={(e) => updateEmployeeItem(emp.employee_id, item.nomenclature_id, 'selected_quantity', parseFloat(e.target.value))}
                          sx={{ width: 100 }}
                          slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                        />

                        {item.selected_quantity === 0 && <Chip icon={<WarningIcon />} label="Не выдается" size="small" variant="outlined" />}

                        <Tooltip title="Удалить этот СИЗ из выдачи">
                          <IconButton size="small" color="error" onClick={() => removeEmployeeItem(emp.employee_id, item.nomenclature_id)}>
                            <RemoveCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}

                  {emp.items.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Все СИЗ удалены. Вы можете удалить сотрудника из списка или добавить его снова.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>

        {employees.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => { setEmployees([]); setSelectAll(false); }}>
              Очистить всё
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || employees.filter(e => e.selected).length === 0}
              startIcon={submitting ? <CircularProgress size={20} /> : <InventoryIcon />}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
            >
              {submitting ? 'Выдача...' : 'Выдать СИЗ выбранным сотрудникам'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Диалог с результатами выдачи */}
      <Dialog open={resultsDialogOpen} onClose={() => setResultsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#4caf50' }} />
            <Typography variant="h6">Результаты выдачи СИЗ</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {issueResults.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Нет данных о выдачах
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell>Сотрудник</TableCell>
                    <TableCell>СИЗ</TableCell>
                    <TableCell>Количество</TableCell>
                    <TableCell>Следующая выдача</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issueResults.map((result, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{result.employee_name}</TableCell>
                      <TableCell>{result.nomenclature_title}</TableCell>
                      <TableCell>{result.quantity}</TableCell>
                      <TableCell>
                        {result.next_issue_date
                          ? new Date(result.next_issue_date).toLocaleDateString('ru-RU')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)} variant="contained">Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default MassIssue;