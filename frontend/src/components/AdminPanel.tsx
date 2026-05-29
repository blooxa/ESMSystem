import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
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
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import api from '../services/api';
import Layout from './Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Данные
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [clothingSizes, setClothingSizes] = useState<any[]>([]);
  const [footwearSizes, setFootwearSizes] = useState<any[]>([]);
  const [headwearSizes, setHeadwearSizes] = useState<any[]>([]);

  // Диалоги
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSizeType, setCurrentSizeType] = useState('clothing');
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  // Формы
  const [userForm, setUserForm] = useState({
    user_id: '',
    login: '',
    password: '',
    role: 'department_head',
    employee_id: '',
    shop_id: '',
  });
  const [shopForm, setShopForm] = useState({ shop_id: '', title: '', code: '' });
  const [employeeForm, setEmployeeForm] = useState({
    employee_id: '',
    first_name: '',
    second_name: '',
    last_name: '',
    position_id: '',
    shop_id: '',
    gender: '',
    heightcm: '',
    clothing_size: '',
    shoesize: '',
    headsize: '',
    is_active: true,
  });
  const [positionForm, setPositionForm] = useState({ position_id: '', title: '' });
  const [sizeForm, setSizeForm] = useState<any>({});

  // Отфильтрованные размеры одежды в зависимости от пола
  const [filteredClothingSizes, setFilteredClothingSizes] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Фильтрация размеров одежды при изменении пола
  useEffect(() => {
    if (employeeForm.gender) {
      const filtered = clothingSizes.filter(size => size.gender === employeeForm.gender || size.gender === 'U');
      setFilteredClothingSizes(filtered);
      if (employeeForm.clothing_size && !filtered.some(size => size.size_code === employeeForm.clothing_size)) {
        setEmployeeForm(prev => ({ ...prev, clothing_size: '' }));
      }
    } else {
      setFilteredClothingSizes(clothingSizes);
    }
  }, [employeeForm.gender, clothingSizes]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, shopsRes, employeesRes, positionsRes, clothingSizesRes, footwearSizesRes, headwearSizesRes] = await Promise.all([
        api.get('/admin/users/get_all_users/'),
        api.get('/admin/shops/get_all_shops/'),
        api.get('/admin/employees/get_all_employees/'),
        api.get('/admin/positions/get_all_positions/'),
        api.get('/admin/sizes/get_all_sizes/?size_type=clothing'),
        api.get('/admin/sizes/get_all_sizes/?size_type=footwear'),
        api.get('/admin/sizes/get_all_sizes/?size_type=headwear'),
      ]);
      setUsers(usersRes.data);
      setShops(shopsRes.data);
      setEmployees(employeesRes.data);
      setPositions(positionsRes.data);
      setClothingSizes(clothingSizesRes.data);
      setFootwearSizes(footwearSizesRes.data);
      setHeadwearSizes(headwearSizesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // CRUD для пользователей
  const handleCreateUser = async () => {
    try {
      await api.post('/admin/users/create_user/', {
        login: userForm.login,
        password: userForm.password,
        role: userForm.role,
        employee_id: userForm.employee_id || null,
        shop_id: userForm.shop_id || null,
      });
      setSuccess('Пользователь создан');
      fetchAllData();
      setUserDialogOpen(false);
      setUserForm({ user_id: '', login: '', password: '', role: 'department_head', employee_id: '', shop_id: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания');
    }
  };

  const handleEditUser = (user: any) => {
    setUserForm({
      user_id: user.user_id,
      login: user.login,
      password: '',
      role: user.role,
      employee_id: user.employee_id || '',
      shop_id: user.shop_id || '',
    });
    setEditMode(true);
    setUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const updateData: any = {
        user_id: userForm.user_id,
        role: userForm.role,
        employee_id: userForm.employee_id || null,
        shop_id: userForm.shop_id || null,
      };
      if (userForm.password) {
        updateData.password = userForm.password;
      }
      await api.put('/admin/users/update_user/', updateData);
      setSuccess('Пользователь обновлен');
      fetchAllData();
      setUserDialogOpen(false);
      setUserForm({ user_id: '', login: '', password: '', role: 'department_head', employee_id: '', shop_id: '' });
      setEditMode(false);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Удалить пользователя?')) {
      try {
        await api.delete('/admin/users/delete_user/', { data: { user_id: userId } });
        setSuccess('Пользователь удален');
        fetchAllData();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  // CRUD для цехов
  const handleCreateShop = async () => {
    try {
      await api.post('/admin/shops/create_shop/', { title: shopForm.title, code: shopForm.code });
      setSuccess('Цех создан');
      fetchAllData();
      setShopDialogOpen(false);
      setShopForm({ shop_id: '', title: '', code: '' });
    } catch (err) {
      setError('Ошибка создания');
    }
  };

  const handleEditShop = (shop: any) => {
    setShopForm({ shop_id: shop.shop_id, title: shop.title, code: shop.code });
    setEditMode(true);
    setShopDialogOpen(true);
  };

  const handleUpdateShop = async () => {
    try {
      await api.put('/admin/shops/update_shop/', { shop_id: shopForm.shop_id, title: shopForm.title, code: shopForm.code });
      setSuccess('Цех обновлен');
      fetchAllData();
      setShopDialogOpen(false);
      setShopForm({ shop_id: '', title: '', code: '' });
      setEditMode(false);
    } catch (err) {
      setError('Ошибка обновления');
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (window.confirm('Удалить цех?')) {
      try {
        await api.delete('/admin/shops/delete_shop/', { data: { shop_id: shopId } });
        setSuccess('Цех удален');
        fetchAllData();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      employee_id: '',
      first_name: '',
      second_name: '',
      last_name: '',
      position_id: '',
      shop_id: '',
      gender: '',
      heightcm: '',
      clothing_size: '',
      shoesize: '',
      headsize: '',
      is_active: true,
    });
    setEditMode(false);
    setEditingEmployeeId(null);
  };

  const handleCreateEmployee = async () => {
    if (!employeeForm.last_name.trim()) {
      setError('Фамилия обязательна');
      return;
    }
    if (!employeeForm.first_name.trim()) {
      setError('Имя обязательно');
      return;
    }
    if (!employeeForm.position_id) {
      setError('Выберите должность');
      return;
    }
    if (!employeeForm.shop_id) {
      setError('Выберите цех');
      return;
    }

    try {
      const createData = {
        last_name: employeeForm.last_name.trim(),
        first_name: employeeForm.first_name.trim(),
        second_name: employeeForm.second_name?.trim() || '',
        position_id: Number(employeeForm.position_id),
        shop_id: Number(employeeForm.shop_id),
        gender: employeeForm.gender || null,
        heightcm: employeeForm.heightcm && employeeForm.heightcm !== '' ? Number(employeeForm.heightcm) : null,
        clothing_size: employeeForm.clothing_size || null,
        shoesize: employeeForm.shoesize && employeeForm.shoesize !== '' ? Number(employeeForm.shoesize) : null,
        headsize: employeeForm.headsize && employeeForm.headsize !== '' ? Number(employeeForm.headsize) : null,
      };

      await api.post('/admin/employees/create_employee/', createData);
      setSuccess('Сотрудник создан');
      fetchAllData();
      setEmployeeDialogOpen(false);
      resetEmployeeForm();
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err.response?.data?.error || 'Ошибка создания сотрудника');
    }
  };

  const handleEditEmployee = (emp: any) => {
    console.log('Editing employee:', emp);

    let firstName = emp.first_name || '';
    let lastName = emp.last_name || '';
    let secondName = emp.second_name || '';

    if (emp.full_name && !firstName && !lastName) {
      const nameParts = emp.full_name.split(' ');
      if (nameParts.length >= 2) {
        lastName = nameParts[0];
        firstName = nameParts[1];
        secondName = nameParts[2] || '';
      }
    }

    setEmployeeForm({
      employee_id: emp.employee_id || '',
      first_name: firstName,
      second_name: secondName,
      last_name: lastName,
      position_id: emp.position_id?.toString() || '',
      shop_id: emp.shop_id?.toString() || '',
      gender: emp.gender || '',
      heightcm: emp.heightcm?.toString() || '',
      clothing_size: emp.clothing_size || '',
      shoesize: emp.shoesize?.toString() || '',
      headsize: emp.headsize?.toString() || '',
      is_active: true,
    });
    setEditMode(true);
    setEmployeeDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!employeeForm.last_name.trim()) {
      setError('Фамилия обязательна');
      return;
    }
    if (!employeeForm.first_name.trim()) {
      setError('Имя обязательно');
      return;
    }
    if (!employeeForm.position_id) {
      setError('Выберите должность');
      return;
    }
    if (!employeeForm.shop_id) {
      setError('Выберите цех');
      return;
    }

    try {
      const updateData = {
        employee_id: employeeForm.employee_id,
        first_name: employeeForm.first_name || '',
        second_name: employeeForm.second_name || '',
        last_name: employeeForm.last_name || '',
        position_id: employeeForm.position_id ? parseInt(employeeForm.position_id) : null,
        shop_id: employeeForm.shop_id ? parseInt(employeeForm.shop_id) : null,
        gender: employeeForm.gender || null,
        heightcm: employeeForm.heightcm ? parseInt(employeeForm.heightcm) : null,
        clothing_size: employeeForm.clothing_size || null,
        shoesize: employeeForm.shoesize ? parseInt(employeeForm.shoesize) : null,
        headsize: employeeForm.headsize ? parseInt(employeeForm.headsize) : null,
        is_active: employeeForm.is_active,
      };

      await api.put('/admin/employees/update_employee/', updateData);
      setSuccess('Сотрудник обновлен');
      fetchAllData();
      setEmployeeDialogOpen(false);
      resetEmployeeForm();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm('Удалить сотрудника?')) {
      try {
        await api.delete('/api/admin/employees/delete_employee/', { data: { employee_id: employeeId } });
        setSuccess('Сотрудник удален');
        fetchAllData();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  // CRUD для должностей
  const handleCreatePosition = async () => {
    try {
      await api.post('/admin/positions/create_position/', { title: positionForm.title });
      setSuccess('Должность создана');
      fetchAllData();
      setPositionDialogOpen(false);
      setPositionForm({ position_id: '', title: '' });
    } catch (err) {
      setError('Ошибка создания');
    }
  };

  const handleEditPosition = (pos: any) => {
    setPositionForm({ position_id: pos.position_id, title: pos.title });
    setEditMode(true);
    setPositionDialogOpen(true);
  };

  const handleUpdatePosition = async () => {
    try {
      await api.put('/admin/positions/update_position/', { position_id: positionForm.position_id, title: positionForm.title });
      setSuccess('Должность обновлена');
      fetchAllData();
      setPositionDialogOpen(false);
      setPositionForm({ position_id: '', title: '' });
      setEditMode(false);
    } catch (err) {
      setError('Ошибка обновления');
    }
  };

  const handleDeletePosition = async (positionId: number) => {
    if (window.confirm('Удалить должность?')) {
      try {
        await api.delete('/api/admin/positions/delete_position/', { data: { position_id: positionId } });
        setSuccess('Должность удалена');
        fetchAllData();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  // CRUD для размеров
  const handleCreateSize = async () => {
    try {
      await api.post('/admin/sizes/create_size/', { ...sizeForm, size_type: currentSizeType });
      setSuccess('Размер создан');
      fetchAllData();
      setSizeDialogOpen(false);
      setSizeForm({});
    } catch (err) {
      setError('Ошибка создания');
    }
  };

  const handleEditSize = (size: any, type: string) => {
    setCurrentSizeType(type);
    setSizeForm(size);
    setEditMode(true);
    setSizeDialogOpen(true);
  };

  const handleUpdateSize = async () => {
    try {
      await api.put('/admin/sizes/update_size/', { ...sizeForm, size_type: currentSizeType });
      setSuccess('Размер обновлен');
      fetchAllData();
      setSizeDialogOpen(false);
      setSizeForm({});
      setEditMode(false);
    } catch (err) {
      setError('Ошибка обновления');
    }
  };

  const handleDeleteSize = async (sizeId: number, type: string) => {
    if (window.confirm('Удалить размер?')) {
      try {
        await api.delete('/admin/sizes/delete_size/', { data: { size_id: sizeId, size_type: type } });
        setSuccess('Размер удален');
        fetchAllData();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return <Chip label="Администратор" color="error" size="small" icon={<AdminIcon />} />;
      case 'economic_head': return <Chip label="Нач. хоз. отдела" color="success" size="small" />;
      case 'department_head': return <Chip label="Нач. цеха" color="warning" size="small" />;
      case 'safety_officer': return <Chip label="Охрана труда" color="info" size="small" />;
      default: return <Chip label={role} size="small" />;
    }
  };

  const openCreateUserDialog = () => {
    setEditMode(false);
    setUserForm({ user_id: '', login: '', password: '', role: 'department_head', employee_id: '', shop_id: '' });
    setUserDialogOpen(true);
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
              Администрирование
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} onClick={fetchAllData} variant="outlined">
            Обновить
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
              <Tab label="Пользователи" />
              <Tab label="Цеха" />
              <Tab label="Сотрудники" />
              <Tab label="Должности" />
              <Tab label="Размеры одежды" />
              <Tab label="Размеры обуви" />
              <Tab label="Размеры головы" />
            </Tabs>

            {/* Пользователи */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateUserDialog}>
                  Добавить пользователя
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Логин</TableCell>
                      <TableCell>Роль</TableCell>
                      <TableCell>Сотрудник</TableCell>
                      <TableCell>Цех</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id} hover>
                        <TableCell>{user.login}</TableCell>
                        <TableCell>{getRoleLabel(user.role)}</TableCell>
                        <TableCell>{user.employee_name || '-'}</TableCell>
                        <TableCell>{user.shop_name || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" color="primary" onClick={() => handleEditUser(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.user_id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Цеха */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); setShopForm({ shop_id: '', title: '', code: '' }); setShopDialogOpen(true); }}>
                  Добавить цех
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Код</TableCell>
                      <TableCell>Название</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shops.map((shop) => (
                      <TableRow key={shop.shop_id} hover>
                        <TableCell>{shop.code}</TableCell>
                        <TableCell>{shop.title}</TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" color="primary" onClick={() => handleEditShop(shop)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={() => handleDeleteShop(shop.shop_id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Сотрудники */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); resetEmployeeForm(); setEmployeeDialogOpen(true); }}>
                  Добавить сотрудника
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>ФИО</TableCell>
                      <TableCell>Должность</TableCell>
                      <TableCell>Цех</TableCell>
                      <TableCell>Рост</TableCell>
                      <TableCell>Размер</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.employee_id} hover>
                        <TableCell>{emp.full_name || `${emp.last_name} ${emp.first_name} ${emp.second_name || ''}`}</TableCell>
                        <TableCell>{emp.position_name || emp.position?.title}</TableCell>
                        <TableCell>{emp.shop_name || emp.shop?.title}</TableCell>
                        <TableCell>{emp.heightcm || emp.height || '-'}</TableCell>
                        <TableCell>{emp.clothing_size || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" color="primary" onClick={() => handleEditEmployee(emp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={() => handleDeleteEmployee(emp.employee_id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Должности */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); setPositionForm({ position_id: '', title: '' }); setPositionDialogOpen(true); }}>
                  Добавить должность
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Название должности</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {positions.map((pos) => (
                      <TableRow key={pos.position_id} hover>
                        <TableCell>{pos.title}</TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" color="primary" onClick={() => handleEditPosition(pos)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={() => handleDeletePosition(pos.position_id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Размеры одежды - ДОБАВЛЕНЫ СТОЛБЦЫ "Талия" и "Бедра" */}
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); setCurrentSizeType('clothing'); setSizeForm({}); setSizeDialogOpen(true); }}>
                  Добавить размер одежды
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Код</TableCell>
                      <TableCell>Пол</TableCell>
                      <TableCell>Рост (от-до)</TableCell>
                      <TableCell>Грудь</TableCell>
                      <TableCell>Талия</TableCell>
                      <TableCell>Бедра</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clothingSizes.map((size) => (
                      <TableRow key={size.size_id} hover>
                        <TableCell>{size.size_code}</TableCell>
                        <TableCell>{size.gender === 'M' ? 'М' : size.gender === 'F' ? 'Ж' : 'У'}</TableCell>
                        <TableCell>{size.height_min}-{size.height_max}</TableCell>
                        <TableCell>{size.chest_circumference || '-'}</TableCell>
                        <TableCell>{size.waist_circumference || '-'}</TableCell>
                        <TableCell>{size.hip_circumference || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" color="primary" onClick={() => handleEditSize(size, 'clothing')}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={() => handleDeleteSize(size.size_id, 'clothing')}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Размеры обуви */}
            <TabPanel value={tabValue} index={5}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); setCurrentSizeType('footwear'); setSizeForm({}); setSizeDialogOpen(true); }}>
                  Добавить размер обуви
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Рос. размер</TableCell>
                      <TableCell>EU</TableCell>
                      <TableCell>Длина стопы (мм)</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {footwearSizes.map((size) => (
                      <TableRow key={size.size_id} hover>
                        <TableCell>{size.size_ru}</TableCell>
                        <TableCell>{size.size_eu}</TableCell>
                        <TableCell>{size.foot_length_min}-{size.foot_length_max}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary" onClick={() => handleEditSize(size, 'footwear')}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSize(size.size_id, 'footwear')}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Размеры головы */}
            <TabPanel value={tabValue} index={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); setCurrentSizeType('headwear'); setSizeForm({}); setSizeDialogOpen(true); }}>
                  Добавить размер головы
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell>Код размера</TableCell>
                      <TableCell>Обхват головы (см)</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {headwearSizes.map((size) => (
                      <TableRow key={size.size_id} hover>
                        <TableCell>{size.size_code}</TableCell>
                        <TableCell>{size.head_circumference_min}-{size.head_circumference_max}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary" onClick={() => handleEditSize(size, 'headwear')}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSize(size.size_id, 'headwear')}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>

      {/* Диалог цеха */}
      <Dialog open={shopDialogOpen} onClose={() => { setShopDialogOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Редактирование цеха' : 'Создание цеха'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Код цеха" fullWidth value={shopForm.code} onChange={(e) => setShopForm({ ...shopForm, code: e.target.value })} />
            <TextField label="Название цеха" fullWidth value={shopForm.title} onChange={(e) => setShopForm({ ...shopForm, title: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShopDialogOpen(false); setEditMode(false); }}>Отмена</Button>
          <Button onClick={editMode ? handleUpdateShop : handleCreateShop} variant="contained">{editMode ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог сотрудника (без изменений) */}
      <Dialog
        key={editingEmployeeId || 'new'}
        open={employeeDialogOpen}
        onClose={() => {
          setEmployeeDialogOpen(false);
          setEditMode(false);
          resetEmployeeForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editMode ? 'Редактирование сотрудника' : 'Создание сотрудника'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '120px' }}>
                <TextField
                  label="Фамилия *"
                  fullWidth
                  required
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '120px' }}>
                <TextField
                  label="Имя *"
                  fullWidth
                  required
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '120px' }}>
                <TextField
                  label="Отчество"
                  fullWidth
                  value={employeeForm.second_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, second_name: e.target.value })}
                />
              </Box>
            </Box>

            <FormControl fullWidth required>
              <InputLabel>Должность *</InputLabel>
              <Select
                value={employeeForm.position_id}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position_id: e.target.value })}
                label="Должность *"
              >
                {positions.map((pos) => (
                  <MenuItem key={pos.position_id} value={pos.position_id}>{pos.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Цех *</InputLabel>
              <Select
                value={employeeForm.shop_id}
                onChange={(e) => setEmployeeForm({ ...employeeForm, shop_id: e.target.value })}
                label="Цех *"
              >
                {shops.map((shop) => (
                  <MenuItem key={shop.shop_id} value={shop.shop_id}>{shop.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">Дополнительные данные</Typography>

            <FormControl fullWidth>
              <InputLabel>Пол</InputLabel>
              <Select
                value={employeeForm.gender}
                onChange={(e) => setEmployeeForm({ ...employeeForm, gender: e.target.value })}
                label="Пол"
              >
                <MenuItem value="">Не указан</MenuItem>
                <MenuItem value="M">Мужской</MenuItem>
                <MenuItem value="F">Женский</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Рост (см)"
              type="number"
              fullWidth
              value={employeeForm.heightcm}
              onChange={(e) => setEmployeeForm({ ...employeeForm, heightcm: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Размер одежды</InputLabel>
              <Select
                value={employeeForm.clothing_size}
                onChange={(e) => setEmployeeForm({ ...employeeForm, clothing_size: e.target.value })}
                label="Размер одежды"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {filteredClothingSizes.map((size) => (
                  <MenuItem key={size.size_code} value={size.size_code}>
                    {size.size_code}
                    {size.height_min && size.height_max && ` (рост ${size.height_min}-${size.height_max} см)`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Размер обуви</InputLabel>
              <Select
                value={employeeForm.shoesize}
                onChange={(e) => setEmployeeForm({ ...employeeForm, shoesize: e.target.value })}
                label="Размер обуви"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {footwearSizes.map((size) => (
                  <MenuItem key={size.size_ru} value={size.size_ru}>
                    {size.size_ru} {size.size_eu && `(EU ${size.size_eu})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Размер головы</InputLabel>
              <Select
                value={employeeForm.headsize}
                onChange={(e) => setEmployeeForm({ ...employeeForm, headsize: e.target.value })}
                label="Размер головы"
              >
                <MenuItem value="">Не выбран</MenuItem>
                {headwearSizes.map((size) => (
                  <MenuItem key={size.size_code} value={size.size_code}>
                    {size.size_code} {size.head_circumference_min && `(${size.head_circumference_min}-${size.head_circumference_max} см)`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEmployeeDialogOpen(false);
            setEditMode(false);
            resetEmployeeForm();
          }}>Отмена</Button>
          <Button
            onClick={editMode ? handleUpdateEmployee : handleCreateEmployee}
            variant="contained"
            disabled={!employeeForm.last_name || !employeeForm.first_name || !employeeForm.position_id || !employeeForm.shop_id}
          >
            {editMode ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог должности */}
      <Dialog open={positionDialogOpen} onClose={() => { setPositionDialogOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Редактирование должности' : 'Создание должности'}</DialogTitle>
        <DialogContent>
          <TextField label="Название должности" fullWidth sx={{ mt: 1 }} value={positionForm.title} onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPositionDialogOpen(false); setEditMode(false); }}>Отмена</Button>
          <Button onClick={editMode ? handleUpdatePosition : handleCreatePosition} variant="contained">{editMode ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог пользователя */}
      <Dialog open={userDialogOpen} onClose={() => { setUserDialogOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Редактирование пользователя' : 'Создание пользователя'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Логин" fullWidth value={userForm.login} onChange={(e) => setUserForm({ ...userForm, login: e.target.value })} disabled={editMode} />
            <TextField label="Пароль" type="password" fullWidth value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={editMode ? "Оставьте пустым, чтобы не менять" : ""} />
            <FormControl fullWidth>
              <InputLabel>Роль</InputLabel>
              <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} label="Роль">
                <MenuItem value="admin">Администратор</MenuItem>
                <MenuItem value="economic_head">Начальник хоз. отдела</MenuItem>
                <MenuItem value="department_head">Начальник цеха</MenuItem>
                <MenuItem value="safety_officer">Охрана труда</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Сотрудник</InputLabel>
              <Select value={userForm.employee_id} onChange={(e) => setUserForm({ ...userForm, employee_id: e.target.value })} label="Сотрудник">
                <MenuItem value="">Не выбран</MenuItem>
                {employees.map((emp) => (<MenuItem key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Цех</InputLabel>
              <Select value={userForm.shop_id} onChange={(e) => setUserForm({ ...userForm, shop_id: e.target.value })} label="Цех">
                <MenuItem value="">Не выбран</MenuItem>
                {shops.map((shop) => (<MenuItem key={shop.shop_id} value={shop.shop_id}>{shop.title}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUserDialogOpen(false); setEditMode(false); }}>Отмена</Button>
          <Button onClick={editMode ? handleUpdateUser : handleCreateUser} variant="contained">{editMode ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог размеров одежды - ДОБАВЛЕНЫ ПОЛЯ "Талия" и "Бедра" */}
      <Dialog open={sizeDialogOpen && currentSizeType === 'clothing'} onClose={() => { setSizeDialogOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Редактирование размера одежды' : 'Создание размера одежды'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Пол</InputLabel>
              <Select value={sizeForm.gender || ''} onChange={(e) => setSizeForm({ ...sizeForm, gender: e.target.value })} label="Пол">
                <MenuItem value="M">Мужской</MenuItem>
                <MenuItem value="F">Женский</MenuItem>
                <MenuItem value="U">Унисекс</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Код размера" fullWidth value={sizeForm.size_code || ''} onChange={(e) => setSizeForm({ ...sizeForm, size_code: e.target.value })} />
            <TextField label="Рост от (см)" type="number" fullWidth value={sizeForm.height_min || ''} onChange={(e) => setSizeForm({ ...sizeForm, height_min: e.target.value })} />
            <TextField label="Рост до (см)" type="number" fullWidth value={sizeForm.height_max || ''} onChange={(e) => setSizeForm({ ...sizeForm, height_max: e.target.value })} />
            <TextField label="Обхват груди (см)" type="number" fullWidth value={sizeForm.chest_circumference || ''} onChange={(e) => setSizeForm({ ...sizeForm, chest_circumference: e.target.value })} />
            <TextField label="Обхват талии (см)" type="number" fullWidth value={sizeForm.waist_circumference || ''} onChange={(e) => setSizeForm({ ...sizeForm, waist_circumference: e.target.value })} />
            <TextField label="Обхват бедер (см)" type="number" fullWidth value={sizeForm.hip_circumference || ''} onChange={(e) => setSizeForm({ ...sizeForm, hip_circumference: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSizeDialogOpen(false); setEditMode(false); }}>Отмена</Button>
          <Button onClick={editMode ? handleUpdateSize : handleCreateSize} variant="contained">{editMode ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdminPanel;