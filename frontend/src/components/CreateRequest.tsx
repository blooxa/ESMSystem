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
  FormHelperText,
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
  RemoveCircle as RemoveCircleIcon,
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

interface CreateRequestProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: string;
}

// Вспомогательные функции
const getDefaultSizeOptions = (sizeType: string): SizeOption[] => {
  if (sizeType === 'clothing') {
    return [
      { value: '88', label: '88', description: 'Рост 158-164 см, грудь 88 см', height_min: 158, height_max: 164, chest: 88 },
      { value: '92', label: '92', description: 'Рост 162-168 см, грудь 92 см', height_min: 162, height_max: 168, chest: 92 },
      { value: '96', label: '96', description: 'Рост 166-172 см, грудь 96 см', height_min: 166, height_max: 172, chest: 96 },
      { value: '100', label: '100', description: 'Рост 170-176 см, грудь 100 см', height_min: 170, height_max: 176, chest: 100 },
      { value: '104', label: '104', description: 'Рост 174-180 см, грудь 104 см', height_min: 174, height_max: 180, chest: 104 },
      { value: '108', label: '108', description: 'Рост 178-184 см, грудь 108 см', height_min: 178, height_max: 184, chest: 108 },
      { value: '112', label: '112', description: 'Рост 182-188 см, грудь 112 см', height_min: 182, height_max: 188, chest: 112 },
      { value: '116', label: '116', description: 'Рост 186-192 см, грудь 116 см', height_min: 186, height_max: 192, chest: 116 },
      { value: '120', label: '120', description: 'Рост 190-196 см, грудь 120 cm', height_min: 190, height_max: 196, chest: 120 },
    ];
  } else if (sizeType === 'footwear') {
    return [
      { value: '36', label: '36', description: 'EU 36' },
      { value: '37', label: '37', description: 'EU 37' },
      { value: '38', label: '38', description: 'EU 38' },
      { value: '39', label: '39', description: 'EU 39' },
      { value: '40', label: '40', description: 'EU 40' },
      { value: '41', label: '41', description: 'EU 41' },
      { value: '42', label: '42', description: 'EU 42' },
      { value: '43', label: '43', description: 'EU 43' },
      { value: '44', label: '44', description: 'EU 44' },
      { value: '45', label: '45', description: 'EU 45' },
      { value: '46', label: '46', description: 'EU 46' },
    ];
  } else {
    return [
      { value: '54', label: '54', description: 'S' },
      { value: '56', label: '56', description: 'M' },
      { value: '58', label: '58', description: 'L' },
      { value: '60', label: '60', description: 'XL' },
      { value: '62', label: '62', description: 'XXL' },
    ];
  }
};

const getDefaultSuggestedSize = (sizeType: string, employee?: Employee): string => {
  if (sizeType === 'clothing') {
    if (employee?.clothing_size) return employee.clothing_size;
    if (employee?.gender === 'M') return '100';
    return '88';
  } else if (sizeType === 'footwear') {
    if (employee?.shoesize) return employee.shoesize.toString();
    if (employee?.gender === 'M') return '42';
    return '38';
  } else {
    if (employee?.headsize) return employee.headsize.toString();
    return '58';
  }
};

const CreateRequest: React.FC<CreateRequestProps> = ({ open, onClose, onSuccess, userRole }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employees, setEmployees] = useState<EmployeeWithPPE[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | string>('');
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Загружаем роль пользователя напрямую из API
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get('/users/me/');
        console.log('=== User data from API ===');
        console.log('Full response:', response.data);
        const role = response.data.role;
        const username = response.data.username;
        console.log('Username:', username);
        console.log('Role from API:', role);

        if (username === 'admin' || role === 'admin' || response.data.is_superuser) {
          setCurrentUserRole('admin');
        } else if (role === 'economic_head') {
          setCurrentUserRole('economic_head');
        } else if (role === 'safety_officer') {
          setCurrentUserRole('safety_officer');
        } else {
          setCurrentUserRole(role || 'user');
        }
        console.log('Final effective role:', currentUserRole);
        console.log('===========================');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setCurrentUserRole(userRole || 'user');
      }
    };

    if (open) {
      fetchUserRole();
    }
  }, [open]);

  // Роли, которые могут видеть ВСЕХ сотрудников
  const canSeeAllEmployees = ['admin', 'economic_head', 'safety_officer'];
  const isRestricted = currentUserRole ? !canSeeAllEmployees.includes(currentUserRole) : true;

  console.log('=== CreateRequest Debug ===');
  console.log('currentUserRole:', currentUserRole);
  console.log('isRestricted:', isRestricted);
  console.log('canSeeAllEmployees:', canSeeAllEmployees);
  console.log('===========================');

  useEffect(() => {
    if (open && currentUserRole) {
      fetchEmployees();
    }
  }, [open, currentUserRole]);

  const fetchEmployees = async () => {
    try {
      let response;
      if (isRestricted) {
        console.log('Fetching only shop employees...');
        response = await api.get('/employees/my_shop_employees/');
      } else {
        console.log('Fetching ALL employees...');
        response = await ppeApi.getAvailableEmployees();
      }
      console.log('Employees fetched:', response.data);
      console.log('Number of employees:', response.data.length);
      setAvailableEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Ошибка при загрузке списка сотрудников');
    }
  };

  const fetchEmployeePPE = async (employeeId: number) => {
  setLoading(true);
  setError('');
  try {
    const response = await ppeApi.getEmployeePPE(employeeId);
    const employee = availableEmployees.find(e => e.employee_id === employeeId);

    // Ключевые слова для СИЗ, которые не требуют размера
    const NO_SIZE_KEYWORDS = [
      'жидкость', 'раствор', 'гель', 'спрей', 'регенерирующ', 'пена', 'мазь', 'крем',
      'средство защитное', 'средство регенерирующее', 'антисептик', 'дезинфицирующ', 'cредства для'
    ];

    const items = await Promise.all(response.data.map(async (item: any) => {
      let sizeType = 'clothing';
      const title_lower = item.nomenclature_title.toLowerCase();
      const unit_lower = item.unit.toLowerCase();

      // Определяем, нужен ли размер для этого СИЗ
      const noSizeNeeded = unit_lower.includes('мл') ||
                           unit_lower.includes('ml') ||
                           unit_lower.includes('л') ||
                           unit_lower.includes('l') ||
                           NO_SIZE_KEYWORDS.some(keyword => title_lower.includes(keyword));

      if (noSizeNeeded) {
        sizeType = 'nosize';
      } else if (title_lower.includes('обув') || title_lower.includes('сапог') || title_lower.includes('ботин')) {
        sizeType = 'footwear';
      } else if (title_lower.includes('каск') || title_lower.includes('шлем') || title_lower.includes('шапк')) {
        sizeType = 'headwear';
      } else {
        sizeType = 'clothing';
      }

      let sizeOptions: SizeOption[] = [];
      let suggestedSize = '';

      // Для СИЗ без размера не загружаем размеры
      if (sizeType !== 'nosize') {
        try {
          const gender = employee?.gender === 'M' ? 'M' : employee?.gender === 'F' ? 'F' : undefined;
          const sizeResponse = await sizeApi.getSizesByType(sizeType, gender);

          if (sizeType === 'clothing') {
            sizeOptions = sizeResponse.data.map((s: any) => ({
              value: s.size_code,
              label: `${s.size_code}`,
              description: `Рост: ${s.height_min || '?'}-${s.height_max || '?'} см, Грудь: ${s.chest_circumference || '?'} см`,
              height_min: s.height_min,
              height_max: s.height_max,
              chest: s.chest_circumference,
            }));

            if (employee?.heightcm) {
              const sortedSizes = [...sizeOptions].sort((a, b) => {
                const aHeight = a.height_min || 0;
                const bHeight = b.height_min || 0;
                return aHeight - bHeight;
              });

              const foundSize = sortedSizes.find(opt =>
                (!opt.height_min || employee.heightcm! >= opt.height_min) &&
                (!opt.height_max || employee.heightcm! <= opt.height_max)
              );

              if (foundSize) {
                suggestedSize = foundSize.value;
              } else if (sortedSizes.length > 0) {
                const minSize = sortedSizes[0];
                const maxSize = sortedSizes[sortedSizes.length - 1];
                if (employee.heightcm < (minSize.height_min || 0)) {
                  suggestedSize = minSize.value;
                } else if (employee.heightcm > (maxSize.height_max || 300)) {
                  suggestedSize = maxSize.value;
                }
              }
            }

            if (!suggestedSize && employee?.clothing_size) {
              const exists = sizeOptions.some(opt => opt.value === employee.clothing_size);
              suggestedSize = exists ? employee.clothing_size : sizeOptions[0]?.value || '';
            }
          } else if (sizeType === 'footwear') {
            sizeOptions = sizeResponse.data.map((s: any) => ({
              value: s.size_ru.toString(),
              label: `${s.size_ru}`,
              description: `EU: ${s.size_eu}, Длина стопы: ${s.foot_length_min || '?'}-${s.foot_length_max || '?'} мм`,
              size_ru: s.size_ru,
              foot_length_min: s.foot_length_min,
              foot_length_max: s.foot_length_max,
            }));

            if (employee?.shoesize) {
              suggestedSize = employee.shoesize.toString();
            } else if (employee?.gender === 'M') {
              suggestedSize = '42';
            } else if (employee?.gender === 'F') {
              suggestedSize = '38';
            }
          } else if (sizeType === 'headwear') {
            sizeOptions = sizeResponse.data.map((s: any) => ({
              value: s.size_code,
              label: `${s.size_code}`,
              description: `Обхват головы: ${s.head_circumference_min || '?'}-${s.head_circumference_max || '?'} см`,
              head_circumference_min: s.head_circumference_min,
              head_circumference_max: s.head_circumference_max,
            }));

            if (employee?.headsize) {
              suggestedSize = employee.headsize.toString();
            } else {
              suggestedSize = '58';
            }
          }
        } catch (e) {
          console.error('Error loading sizes:', e);
          sizeOptions = getDefaultSizeOptions(sizeType);
          suggestedSize = getDefaultSuggestedSize(sizeType, employee);
        }

        if (!suggestedSize && sizeOptions.length > 0) {
          suggestedSize = sizeOptions[0].value;
        }
      }

      // Для СИЗ без размера всегда количество = 1, размер не нужен
      let defaultQuantity = Number(item.standard_quantity);
      if (noSizeNeeded) {
        defaultQuantity = 1;
      } else if (item.days_until_expiry !== null && item.days_until_expiry <= 150) {
        defaultQuantity = Number(item.standard_quantity);
      } else if (!item.can_order) {
        defaultQuantity = 0;
      } else {
        defaultQuantity = Number(item.standard_quantity);
      }

      return {
        ...item,
        selected_size: noSizeNeeded ? '' : suggestedSize,
        selected_quantity: defaultQuantity,
        size_type: sizeType,
        size_options: sizeOptions,
        size_recommended: suggestedSize,
        is_liquid: noSizeNeeded,
      };
    }));

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
      }]);
    }
  } catch (error) {
    console.error('Error fetching PPE:', error);
    setError('Ошибка при загрузке данных о СИЗ');
  } finally {
    setLoading(false);
    setSelectedEmployee('');
  }
};

  const removeEmployee = (employeeId: number) => {
    setEmployees(prev => prev.filter(e => e.employee_id !== employeeId));
  };

  // Новая функция для удаления отдельного СИЗ у сотрудника
  const removeEmployeeItem = (employeeId: number, nomenclatureId: number) => {
  console.log('=== REMOVE ITEM DEBUG ===');
  console.log('employeeId:', employeeId);
  console.log('nomenclatureId to remove:', nomenclatureId);

  const employee = employees.find(e => e.employee_id === employeeId);
  if (employee) {
    console.log('Current items IDs:', employee.items.map(i => i.nomenclature_id));
  }

  setEmployees(prev => {
    const newState = prev.map(emp => {
      if (emp.employee_id === employeeId) {
        const newItems = emp.items.filter(item => {
          const shouldKeep = item.nomenclature_id !== nomenclatureId;
          if (!shouldKeep) {
            console.log(`Removing item with ID: ${item.nomenclature_id} (${item.nomenclature_title})`);
          }
          return shouldKeep;
        });
        return { ...emp, items: newItems };
      }
      return emp;
    });

    // Проверяем результат
    const updatedEmployee = newState.find(e => e.employee_id === employeeId);
    console.log('After removal - items left:', updatedEmployee?.items.map(i => i.nomenclature_id));

    return newState;
  });
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
      // Проверяем только нежидкие СИЗ, у которых есть размер
      if (!item.is_liquid && item.selected_quantity > 0 && !item.selected_size) {
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
              selected_size: item.selected_size,
              selected_quantity: item.selected_quantity,
            })),
        })),
      };

      const response = await ppeApi.createFullRequest(requestData);

      if (response.data.excel_report) {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${response.data.excel_report}`;
        link.download = `request_${response.data.request_number}.xlsx`;
        link.click();
      }

      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error creating request:', error);
      setError(error.response?.data?.error || 'Ошибка при создании заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEmployees([]);
    setSelectedEmployee('');
    setError('');
  };

  const getAvailableEmployeesList = () => {
    const addedIds = employees.map(e => e.employee_id);
    return availableEmployees.filter(e => !addedIds.includes(e.employee_id));
  };

  const getSizeTypeIcon = (type: string) => {
    switch (type) {
      case 'clothing': return <AccessibilityIcon fontSize="small" />;
      case 'footwear': return <StraightenIcon fontSize="small" />;
      case 'liquid': return <InfoIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Создание заявки на СИЗ
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isRestricted && currentUserRole && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Вы можете добавлять только сотрудников вашего цеха.
            </Typography>
          </Alert>
        )}

        {!isRestricted && currentUserRole && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              У вас есть доступ ко всем сотрудникам предприятия.
            </Typography>
          </Alert>
        )}

        {!currentUserRole && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Загрузка информации о пользователе...
            </Typography>
          </Alert>
        )}

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

        <Typography variant="h6" sx={{ mb: 2 }}>
          Сотрудники
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
          <Button
            variant="contained"
            onClick={() => selectedEmployee && fetchEmployeePPE(selectedEmployee as number)}
            disabled={!selectedEmployee || loading}
            startIcon={<AddIcon />}
          >
            Добавить
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

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
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                  <TextField label="Размер одежды" value={emp.clothing_size || ''} size="small" sx={{ width: 150 }} disabled />
                  <TextField label="Размер обуви" value={emp.shoesize || ''} size="small" sx={{ width: 150 }} disabled />
                  <TextField label="Размер головы" value={emp.headsize || ''} size="small" sx={{ width: 150 }} disabled />
                </Box>
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 2 }}>Список СИЗ для заказа</Typography>
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
      border: '1px solid',
      borderColor: item.status_color === '#f44336' ? '#ffcdd2' :
                   item.status_color === '#ff9800' ? '#ffe0b2' : '#c8e6c9',
      bgcolor: item.status_color === '#f44336' ? '#ffebee' :
               item.status_color === '#ff9800' ? '#fff3e0' : '#e8f5e9',
      position: 'relative',
    }}
  >
    <Box sx={{ flex: 2, minWidth: 200 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {getSizeTypeIcon(item.size_type)}
        {item.nomenclature_title}
        {item.is_liquid && (
          <Chip label="Жидкость" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
        )}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Норма: {item.standard_quantity} {item.unit} / {item.period_months} мес.
      </Typography>
      {item.last_issue_date && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          Последняя выдача: {new Date(item.last_issue_date).toLocaleDateString('ru-RU')}
        </Typography>
      )}
      {item.status_text && (
        <Chip
          label={item.status_text}
          size="small"
          sx={{
            mt: 0.5,
            bgcolor: item.status_color,
            color: '#fff',
            fontSize: '0.7rem',
            height: 20
          }}
        />
      )}
    </Box>

    {/* Поле размера - скрываем для жидкостей */}
    {!item.is_liquid && (
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
      slotProps={{ htmlInput: { min: 0, step: item.is_liquid ? 1 : 0.5 } }}
    />

    {/* Кнопка удаления СИЗ */}
    <Tooltip title="Удалить этот СИЗ из заявки">
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
              {/* Показываем сообщение, если все СИЗ удалены */}
              {emp.items.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Все СИЗ удалены. Вы можете удалить сотрудника из заявки или добавить его снова.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title || employees.length === 0 || submitting}>
          {submitting ? <CircularProgress size={24} /> : 'Создать заявку и скачать Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRequest;