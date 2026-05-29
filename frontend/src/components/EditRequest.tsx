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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Straighten as StraightenIcon,
  Accessibility as AccessibilityIcon,
  RemoveCircle as RemoveCircleIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { ppeApi, sizeApi } from '../services/api';
import api from '../services/api';

interface Employee {
  employee_id: number;
  full_name: string;
  position_name: string;
  gender?: string;
  heightcm?: number;
  clothing_size?: string;
  shoesize?: number;
  headsize?: number;
}

interface SizeOption {
  value: string;
  label: string;
  description?: string;
  chest?: number;
  height_min?: number;
  height_max?: number;
  size_ru?: number;
  foot_length_min?: number;
  foot_length_max?: number;
  head_circumference_min?: number;
  head_circumference_max?: number;
}

interface PPEItem {
  nomenclature_id: number;
  nomenclature_title: string;
  unit: string;
  standard_quantity: number;
  period_months: number;
  last_issue_date: string | null;
  can_order: boolean;
  selected_size: string;
  selected_quantity: number;
  size_type: string;
  size_options: SizeOption[];
  size_recommended?: string;
  days_until_expiry?: number | null;
  status_color?: string;
  status_text?: string;
  is_liquid?: boolean;
}

interface EmployeeWithPPE {
  employee_id: number;
  full_name: string;
  position_name: string;
  gender?: string;
  height: number | null;
  clothing_size?: string;
  shoesize?: number;
  headsize?: number;
  items: PPEItem[];
}

interface EditRequestProps {
  open: boolean;
  requestId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EditRequest: React.FC<EditRequestProps> = ({ open, requestId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Данные заявки
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employees, setEmployees] = useState<EmployeeWithPPE[]>([]);
  const [originalEmployees, setOriginalEmployees] = useState<EmployeeWithPPE[]>([]);

  // Для добавления новых сотрудников
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | string>('');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);

  // Функция для определения, является ли СИЗ жидкостью/сыпучим
  const isLiquidOrBulk = (title: string, unit?: string): boolean => {
    const title_lower = title.toLowerCase();

    // Список единиц измерения, которые указывают на жидкости/сыпучие
    const LIQUID_UNITS = ['мл', 'л', 'г', 'кг', 'ml', 'l', 'g', 'kg', 'литр', 'миллилитр', 'грамм', 'килограмм'];

    // Проверяем по единице измерения (приоритетный способ)
    if (unit && LIQUID_UNITS.includes(unit.toLowerCase())) {
      console.log(`Detected as liquid by unit: ${title} (unit: ${unit})`);
      return true;
    }

    // Проверяем по ключевым словам в названии
    const LIQUID_KEYWORDS = [
      'жидкость', 'раствор', 'гель', 'спрей', 'пена', 'мазь', 'крем',
      'очищение', 'очищения', 'моющее', 'чистящее', 'очиститель', 'очистительное',
      'средство', 'средства',
      'шампунь', 'мыло', 'паста', 'эмульсия', 'лосьон', 'бальзам', 'кондиционер',
      'дезинфицирующее', 'антисептик', 'регенерирующ',
      'смазка', 'масло', 'краска', 'лак', 'клей', 'герметик',
      'порошок', 'гранулы', 'сыпучий', 'наполнитель',
      'загрязнение', 'загрязнений', 'неустойчивых'
    ];

    const isLiquid = LIQUID_KEYWORDS.some(keyword => title_lower.includes(keyword));
    if (isLiquid) {
      console.log(`Detected as liquid by keyword: ${title}`);
    }
    return isLiquid;
  };

  const detectSizeType = (title: string, unit?: string): string => {
    // Если это жидкость или сыпучее - возвращаем 'nosize'
    if (isLiquidOrBulk(title, unit)) {
      return 'nosize';
    }

    const title_lower = title.toLowerCase();

    // Определение типов СИЗ
    if (title_lower.includes('обув') || title_lower.includes('сапог') || title_lower.includes('ботин')) {
      return 'footwear';
    }
    if (title_lower.includes('каск') || title_lower.includes('шлем') || title_lower.includes('шапк')) {
      return 'headwear';
    }

    return 'clothing';
  };

  // Загрузка доступных сотрудников и номенклатур
  useEffect(() => {
    if (open) {
      fetchAvailableEmployees();
      fetchNomenclatures();
      fetchRequestData();
    }
  }, [open, requestId]);

  const fetchRequestData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/requests/${requestId}/request_details/`);
      const data = response.data;
      setTitle(data.title || '');
      setDescription(data.description || '');

      // Преобразуем данные в формат EmployeeWithPPE
      const employeesData: EmployeeWithPPE[] = data.employees.map((emp: any) => ({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        position_name: emp.position_name,
        gender: emp.gender,
        height: emp.height,
        clothing_size: emp.clothing_size,
        shoesize: emp.shoesize,
        headsize: emp.headsize,
        items: emp.items.map((item: any) => {
          // Передаем unit в функцию определения типа
          const sizeType = detectSizeType(item.nomenclature_title, item.unit);
          const isLiquid = sizeType === 'nosize';
          console.log(`Item: ${item.nomenclature_title}, unit: ${item.unit}, sizeType: ${sizeType}, isLiquid: ${isLiquid}`);
          return {
            nomenclature_id: item.nomenclature_id,
            nomenclature_title: item.nomenclature_title,
            unit: item.unit,
            standard_quantity: item.quantity,
            period_months: 12,
            last_issue_date: null,
            can_order: true,
            selected_size: item.size || '',
            selected_quantity: item.quantity,
            size_type: sizeType,
            size_options: [],
            size_recommended: item.size,
            is_liquid: isLiquid,
          };
        }),
      }));

      setEmployees(employeesData);
      setOriginalEmployees(JSON.parse(JSON.stringify(employeesData)));

      // Загружаем размеры только для НЕ жидкостей
      for (const emp of employeesData) {
        for (const item of emp.items) {
          if (!item.is_liquid && item.size_type !== 'nosize') {
            await loadSizeOptions(emp, item);
          }
        }
      }

    } catch (err: any) {
      console.error('Error fetching request:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки заявки');
    } finally {
      setLoading(false);
    }
  };

  const loadSizeOptions = async (employee: EmployeeWithPPE, item: PPEItem) => {
    if (item.size_type === 'nosize' || item.is_liquid) return;

    try {
      const gender = employee?.gender === 'M' ? 'M' : employee?.gender === 'F' ? 'F' : undefined;
      const sizeResponse = await sizeApi.getSizesByType(item.size_type, gender);

      let sizeOptions: SizeOption[] = [];
      if (item.size_type === 'clothing') {
        sizeOptions = sizeResponse.data.map((s: any) => ({
          value: s.size_code,
          label: `${s.size_code}`,
          description: `Рост: ${s.height_min || '?'}-${s.height_max || '?'} см, Грудь: ${s.chest_circumference || '?'} см`,
          height_min: s.height_min,
          height_max: s.height_max,
          chest: s.chest_circumference,
        }));
      } else if (item.size_type === 'footwear') {
        sizeOptions = sizeResponse.data.map((s: any) => ({
          value: s.size_ru.toString(),
          label: `${s.size_ru}`,
          description: `EU: ${s.size_eu}, Длина стопы: ${s.foot_length_min || '?'}-${s.foot_length_max || '?'} мм`,
        }));
      } else if (item.size_type === 'headwear') {
        sizeOptions = sizeResponse.data.map((s: any) => ({
          value: s.size_code,
          label: `${s.size_code}`,
          description: `Обхват головы: ${s.head_circumference_min || '?'}-${s.head_circumference_max || '?'} см`,
        }));
      }

      item.size_options = sizeOptions;
    } catch (e) {
      console.error('Error loading sizes:', e);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const response = await api.get('/employees/my_shop_employees/');
      setAvailableEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchNomenclatures = async () => {
    try {
      const response = await api.get('/nomenclatures/');
      setNomenclatures(response.data);
    } catch (error) {
      console.error('Error fetching nomenclatures:', error);
    }
  };

  const fetchEmployeePPE = async (employeeId: number) => {
    setAddingEmployee(true);
    try {
      const response = await ppeApi.getEmployeePPE(employeeId);
      const employee = availableEmployees.find(e => e.employee_id === employeeId);

      if (!employee) return;

      const items = await Promise.all(response.data.map(async (item: any) => {
        const sizeType = detectSizeType(item.nomenclature_title, item.unit);
        const isLiquid = sizeType === 'nosize';
        let sizeOptions: SizeOption[] = [];
        let suggestedSize = '';

        if (sizeType !== 'nosize' && !isLiquid) {
          try {
            const gender = employee?.gender === 'M' ? 'M' : employee?.gender === 'F' ? 'F' : undefined;
            const sizeResponse = await sizeApi.getSizesByType(sizeType, gender);

            if (sizeType === 'clothing') {
              sizeOptions = sizeResponse.data.map((s: any) => ({
                value: s.size_code,
                label: `${s.size_code}`,
                description: `Рост: ${s.height_min || '?'}-${s.height_max || '?'} см`,
              }));
              suggestedSize = employee?.clothing_size || sizeOptions[0]?.value || '';
            } else if (sizeType === 'footwear') {
              sizeOptions = sizeResponse.data.map((s: any) => ({
                value: s.size_ru.toString(),
                label: `${s.size_ru}`,
              }));
              suggestedSize = employee?.shoesize?.toString() || '42';
            } else {
              sizeOptions = sizeResponse.data.map((s: any) => ({
                value: s.size_code,
                label: `${s.size_code}`,
              }));
              suggestedSize = employee?.headsize?.toString() || '58';
            }
          } catch (e) {
            console.error('Error loading sizes:', e);
          }
        }

        return {
          nomenclature_id: item.nomenclature_id,
          nomenclature_title: item.nomenclature_title,
          unit: item.unit,
          standard_quantity: Number(item.standard_quantity),
          period_months: 12,
          last_issue_date: null,
          can_order: true,
          selected_size: suggestedSize,
          selected_quantity: Number(item.standard_quantity),
          size_type: sizeType,
          size_options: sizeOptions,
          is_liquid: isLiquid,
        };
      }));

      // Добавляем нового сотрудника к существующим
      const newEmployee: EmployeeWithPPE = {
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        position_name: employee.position_name,
        gender: employee.gender,
        height: employee.heightcm || null,
        clothing_size: employee.clothing_size,
        shoesize: employee.shoesize,
        headsize: employee.headsize,
        items: items,
      };

      setEmployees(prev => [...prev, newEmployee]);
      setAddDialogOpen(false);
      setSelectedEmployee('');

    } catch (err: any) {
      console.error('Error fetching PPE:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки СИЗ для сотрудника');
    } finally {
      setAddingEmployee(false);
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

  const updateEmployeeHeight = (employeeId: number, height: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employee_id === employeeId) {
        return { ...emp, height };
      }
      return emp;
    }));
  };

  const handleSubmit = async () => {
    if (!title || employees.length === 0) {
      setError('Заполните название заявки и добавьте хотя бы одного сотрудника');
      return;
    }

    for (const emp of employees) {
      for (const item of emp.items) {
        // Проверяем размер только для НЕ жидкостей
        if (!item.is_liquid && item.selected_quantity > 0 && (!item.selected_size || item.selected_size === '')) {
          setError(`Для сотрудника ${emp.full_name} укажите размер для ${item.nomenclature_title}`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const requestData = {
        title,
        description,
        employees: employees.map(emp => ({
          employee_id: emp.employee_id,
          height: emp.height,
          items: emp.items
            .filter(item => item.selected_quantity > 0)
            .map(item => ({
              nomenclature_id: item.nomenclature_id,
              selected_size: item.is_liquid ? '' : item.selected_size,
              selected_quantity: item.selected_quantity,
            })),
        })),
      };

      console.log('Sending update data:', JSON.stringify(requestData, null, 2));

      await api.put(`/requests/${requestId}/update_full_request/`, requestData);
      setSuccess('Заявка успешно обновлена');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error updating request:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Ошибка при сохранении изменений');
    } finally {
      setSubmitting(false);
    }
  };

  const getSizeTypeIcon = (type: string) => {
    switch (type) {
      case 'clothing': return <AccessibilityIcon fontSize="small" />;
      case 'footwear': return <StraightenIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getAvailableEmployeesList = () => {
    const addedIds = employees.map(e => e.employee_id);
    return availableEmployees.filter(e => !addedIds.includes(e.employee_id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Редактирование заявки #{requestId}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Название заявки *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Сотрудники и СИЗ
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Добавить сотрудника
              </Button>
            </Box>

            {employees.map(emp => (
              <Accordion key={emp.employee_id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{emp.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.position_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {emp.clothing_size && (
                        <Chip label={`Одежда: ${emp.clothing_size}`} size="small" variant="outlined" />
                      )}
                      {emp.shoesize && (
                        <Chip label={`Обувь: ${emp.shoesize}`} size="small" variant="outlined" />
                      )}
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
                      <TextField
                        label="Рост (см)"
                        type="number"
                        value={emp.height || ''}
                        onChange={(e) => updateEmployeeHeight(emp.employee_id, parseInt(e.target.value))}
                        size="small"
                        sx={{ width: 150 }}
                      />
                      <TextField label="Размер одежды" value={emp.clothing_size || ''} size="small" sx={{ width: 150 }} disabled />
                      <TextField label="Размер обуви" value={emp.shoesize || ''} size="small" sx={{ width: 150 }} disabled />
                      <TextField label="Размер головы" value={emp.headsize || ''} size="small" sx={{ width: 150 }} disabled />
                    </Box>
                  </Paper>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Список СИЗ</Typography>

                  {emp.items.map(item => (
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
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ flex: 2, minWidth: 200 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getSizeTypeIcon(item.size_type)}
                          {item.nomenclature_title}
                          {item.is_liquid && (
                            <Chip label="Жидкость/Сыпучие" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Норма: {item.standard_quantity} {item.unit} / {item.period_months} мес.
                        </Typography>
                      </Box>

                      {/* Показываем выбор размера ТОЛЬКО если это НЕ жидкость */}
                      {!item.is_liquid && item.size_type !== 'nosize' && item.size_options.length > 0 && (
                        <FormControl size="small" sx={{ width: 140 }}>
                          <InputLabel>Размер</InputLabel>
                          <Select
                            value={item.selected_size}
                            onChange={(e) => updateEmployeeItem(emp.employee_id, item.nomenclature_id, 'selected_size', e.target.value)}
                            label="Размер"
                          >
                            {item.size_options.map(opt => (
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



                      <TextField
                        label="Кол-во"
                        type="number"
                        size="small"
                        value={item.selected_quantity}
                        onChange={(e) => updateEmployeeItem(emp.employee_id, item.nomenclature_id, 'selected_quantity', parseFloat(e.target.value))}
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                      />

                      <Tooltip title="Удалить СИЗ">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEmployeeItem(emp.employee_id, item.nomenclature_id)}
                        >
                          <RemoveCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}

                  {emp.items.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Все СИЗ удалены. Вы можете удалить сотрудника из заявки.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            {employees.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Нет добавленных сотрудников. Добавьте сотрудника для создания заявки.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title || employees.length === 0 || submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          color="primary"
        >
          {submitting ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </DialogActions>

      {/* Диалог добавления сотрудника */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавление сотрудника</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
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
            {addingEmployee && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={30} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => selectedEmployee && fetchEmployeePPE(selectedEmployee as number)}
            variant="contained"
            disabled={!selectedEmployee || addingEmployee}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditRequest;