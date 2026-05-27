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
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Straighten as StraightenIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { employeesApi, sizeApi } from '../services/api';
import Layout from './Layout';

interface Employee {
  employee_id: number;
  full_name: string;
  first_name: string;
  second_name: string;
  last_name: string;
  position_name: string;
  shop_name: string;
  gender: 'M' | 'F' | null;
  heightcm: number | null;
  clothing_size: string | null;
  shoesize: number | null;
  headsize: number | null;
  is_active: boolean;
  hire_date: string;
}

interface SizeOption {
  value: string;
  label: string;
}

const EmployeesManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const [editForm, setEditForm] = useState({
    heightcm: '',
    clothing_size: '',
    shoesize: '',
    headsize: '',
    gender: '',
  });

  const [clothingSizes, setClothingSizes] = useState<SizeOption[]>([]);
  const [footwearSizes, setFootwearSizes] = useState<SizeOption[]>([]);
  const [headwearSizes, setHeadwearSizes] = useState<SizeOption[]>([]);

  useEffect(() => {
    fetchEmployees();
    loadSizeOptions();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.getMyShopEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const loadSizeOptions = async () => {
    try {
      const [clothing, footwear, headwear] = await Promise.all([
        sizeApi.getSizesByType('clothing'),
        sizeApi.getSizesByType('footwear'),
        sizeApi.getSizesByType('headwear'),
      ]);
      setClothingSizes(clothing.data.map((s: any) => ({ value: s.size_code, label: s.size_code })));
      setFootwearSizes(footwear.data.map((s: any) => ({ value: s.size_ru.toString(), label: `${s.size_ru} (EU:${s.size_eu})` })));
      setHeadwearSizes(headwear.data.map((s: any) => ({ value: s.size_code, label: s.size_code })));
    } catch (error) {
      console.error('Error loading sizes:', error);
    }
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      heightcm: employee.heightcm?.toString() || '',
      clothing_size: employee.clothing_size || '',
      shoesize: employee.shoesize?.toString() || '',
      headsize: employee.headsize?.toString() || '',
      gender: employee.gender || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await employeesApi.updateEmployee(selectedEmployee.employee_id, {
        heightcm: editForm.heightcm ? parseInt(editForm.heightcm) : null,
        clothing_size: editForm.clothing_size || null,
        shoesize: editForm.shoesize ? parseInt(editForm.shoesize) : null,
        headsize: editForm.headsize ? parseInt(editForm.headsize) : null,
        gender: editForm.gender || null,
      });

      setSuccess('Данные сотрудника успешно обновлены');
      fetchEmployees();
      setEditDialogOpen(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Ошибка при сохранении данных');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'M') return 'Мужской';
    if (gender === 'F') return 'Женский';
    return 'Не указан';
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
            <Typography variant="body1" color="text.secondary">
              Редактирование антропометрических данных сотрудников вашего цеха
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchEmployees}
            variant="outlined"
          >
            Обновить
          </Button>
        </Box>

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

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
              <Tab label="Список сотрудников" />
              <Tab label="Статистика" />
            </Tabs>

            {tabValue === 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ФИО</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Должность</TableCell>
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
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">Нет сотрудников в вашем цехе</Typography>
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
                          <TableCell>
                            <Chip
                              label={getGenderLabel(emp.gender)}
                              size="small"
                              variant="outlined"
                              icon={<PersonIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            {emp.heightcm ? `${emp.heightcm} см` : '-'}
                          </TableCell>
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
                            <Tooltip title="Редактировать антропометрию">
                              <IconButton
                                size="small"
                                onClick={() => handleEditClick(emp)}
                                sx={{ color: '#1976d2' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Paper sx={{ p: 3, bgcolor: '#e3f2fd', flex: '1 1 300px' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Статистика по размерам одежды</Typography>
                    {(() => {
                      const stats = employees.reduce((acc, emp) => {
                        const size = emp.clothing_size || 'Не указан';
                        acc[size] = (acc[size] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      return Object.entries(stats).map(([size, count]) => (
                        <Box key={size} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{size}</Typography>
                          <Chip label={count} size="small" />
                        </Box>
                      ));
                    })()}
                  </Paper>
                  <Paper sx={{ p: 3, bgcolor: '#fff3e0', flex: '1 1 300px' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Статистика по росту</Typography>
                    {(() => {
                      const heights = employees.filter(e => e.heightcm).map(e => e.heightcm!);
                      if (heights.length === 0) return <Typography>Нет данных</Typography>;
                      const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
                      return (
                        <Box>
                          <Typography>Средний рост: {Math.round(avgHeight)} см</Typography>
                          <Typography>Минимальный: {Math.min(...heights)} см</Typography>
                          <Typography>Максимальный: {Math.max(...heights)} см</Typography>
                        </Box>
                      );
                    })()}
                  </Paper>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Редактирование данных: {selectedEmployee?.full_name}
            </Typography>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Пол</InputLabel>
              <Select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                label="Пол"
              >
                <MenuItem value="">Не указан</MenuItem>
                <MenuItem value="M">Мужской</MenuItem>
                <MenuItem value="F">Женский</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Рост (см)"
              type="number"
              value={editForm.heightcm}
              onChange={(e) => setEditForm({ ...editForm, heightcm: e.target.value })}
              slotProps={{
                htmlInput: { min: 0 }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Размер одежды</InputLabel>
              <Select
                value={editForm.clothing_size}
                onChange={(e) => setEditForm({ ...editForm, clothing_size: e.target.value })}
                label="Размер одежды"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {clothingSizes.map(size => (
                  <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Размер обуви</InputLabel>
              <Select
                value={editForm.shoesize}
                onChange={(e) => setEditForm({ ...editForm, shoesize: e.target.value })}
                label="Размер обуви"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {footwearSizes.map(size => (
                  <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Размер головы</InputLabel>
              <Select
                value={editForm.headsize}
                onChange={(e) => setEditForm({ ...editForm, headsize: e.target.value })}
                label="Размер головы"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {headwearSizes.map(size => (
                  <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
            Отмена
          </Button>
          <Button
            onClick={handleSaveEmployee}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Сохранить изменения
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default EmployeesManagement;