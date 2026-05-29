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
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Security as SafetyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { requestsApi } from '../services/api';
import api from '../services/api';
import { Request } from '../types';
import Layout from './Layout';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
interface RequestDetail {
  request_id: number;
  request_number: string;
  title: string;
  description: string;
  status: string;
  status_display: string;
  created_at: string;
  requester_name: string;
  shop_name: string;
  comment?: string;
  employees: {
    employee_id: number;
    full_name: string;
    position_name: string;
    height: number | null;
    items: {
      nomenclature_title: string;
      size: string;
      quantity: number;
      unit: string;
    }[];
  }[];
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`safety-tabpanel-${index}`}
      aria-labelledby={`safety-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// Компонент для отображения списка должностей
const PositionsList: React.FC<{
  positions: any[];
  onSelectPosition: (position: any) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}> = ({ positions, onSelectPosition, searchTerm, onSearchChange }) => {
  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Поиск по должности..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }
        }}
      />
      <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
        <List dense>
          {filteredPositions.length === 0 ? (
            <ListItem>
              <ListItemText primary="Должности не найдены" />
            </ListItem>
          ) : (
            filteredPositions.map((position) => (
              <React.Fragment key={position.position_id}>
                <ListItemButton onClick={() => onSelectPosition(position)}>
                  <ListItemText primary={position.title} />
                  <ChevronRightIcon color="action" />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

// Компонент для отображения норм выдачи для выбранной должности
const PositionStandards: React.FC<{
  position: any;
  standards: any[];
  nomenclatures: any[];
  onBack: () => void;
  onEditStandard: (standard: any) => void;
  onDeleteStandard: (standardId: number) => void;
  onAddStandard: () => void;
  onAddNomenclature: () => void;
}> = ({ position, standards, nomenclatures, onBack, onEditStandard, onDeleteStandard, onAddStandard, onAddNomenclature }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <IconButton onClick={onBack} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Нормы выдачи СИЗ: {position?.title}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddNomenclature}
          >
            Новое СИЗ
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddStandard}
          >
            Добавить норму
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#fafafa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Количество</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ед. изм.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Период (мес.)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    Нет норм выдачи для этой должности
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onAddStandard}
                    sx={{ mt: 2 }}
                  >
                    Добавить первую норму
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              standards.map((std) => (
                <TableRow key={std.standard_id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {std.nomenclature_title}
                    </Typography>
                  </TableCell>
                  <TableCell>{std.quantity}</TableCell>
                  <TableCell>{std.unit}</TableCell>
                  <TableCell>{std.period_months}</TableCell>
                  <TableCell>
                    <Tooltip title="Редактировать">
                      <IconButton size="small" color="primary" onClick={() => onEditStandard(std)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton size="small" color="error" onClick={() => onDeleteStandard(std.standard_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Компонент для управления СИЗ
const NomenclaturesList: React.FC<{
  nomenclatures: any[];
  onEdit: (nomenclature: any) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}> = ({ nomenclatures, onEdit, onDelete, onCreate }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
        >
          Создать СИЗ
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#fafafa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Название СИЗ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ед. изм.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Срок службы (мес.)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nomenclatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    Нет доступных СИЗ
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onCreate}
                    sx={{ mt: 2 }}
                  >
                    Создать первый СИЗ
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              nomenclatures.map((nom) => (
                <TableRow key={nom.nomenclature_id} hover>
                  <TableCell>{nom.nomenclature_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {nom.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{nom.unit}</TableCell>
                  <TableCell>{nom.shelf_life_months}</TableCell>

                  <TableCell>
                    <Tooltip title="Редактировать">
                      <IconButton size="small" color="primary" onClick={() => onEdit(nom)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Деактивировать">
                      <IconButton size="small" color="error" onClick={() => onDelete(nom.nomenclature_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
const SafetyDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
 // Добавьте эти строки ЗДЕСЬ:
  const [requestDetails, setRequestDetails] = useState<RequestDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Данные для норм
  const [positions, setPositions] = useState<any[]>([]);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);
  const [allStandards, setAllStandards] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [positionStandards, setPositionStandards] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Диалоги
  const [standardDialogOpen, setStandardDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStandard, setCurrentStandard] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [standardToDelete, setStandardToDelete] = useState<any>(null);
  const [standardForm, setStandardForm] = useState({
    position_id: '',
    nomenclature_id: '',
    quantity: 1,
    period_months: 12,
  });

  // Состояния для управления СИЗ
  const [nomenclatureDialogOpen, setNomenclatureDialogOpen] = useState(false);
  const [nomenclatureEditDialogOpen, setNomenclatureEditDialogOpen] = useState(false);
  const [editingNomenclature, setEditingNomenclature] = useState<any>(null);
  const [nomenclatureForm, setNomenclatureForm] = useState({
    title: '',
    unit: 'шт',
    shelf_life_months: 12,
  });

  // Получение роли пользователя
 const fetchUserRole = async () => {
  try {
    const response = await api.get('/users/me/');
    console.log('=== USER ROLE DEBUG ===');
    console.log('Full response:', response.data);
    console.log('User role:', response.data.role);
    setUserRole(response.data.role);
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
};

const fetchRequests = async () => {
  try {
    setLoading(true);
    setError('');
    // Для охраны труда
    const response = await api.get('/requests/safety_pending_requests/');
    const data = Array.isArray(response.data) ? response.data : [];
    setRequests(data);
  } catch (error) {
    console.error('Error fetching requests:', error);
    setError('Ошибка при загрузке заявок');
    setRequests([]);
  } finally {
    setLoading(false);
  }
};
const fetchRequestDetails = async (requestId: number) => {
  setDetailsLoading(true);
  try {
    const response = await api.get(`/requests/${requestId}/request_details/`);
    setRequestDetails(response.data);
    setViewDialogOpen(true);
  } catch (error) {
    console.error('Error fetching request details:', error);
    setError('Ошибка при загрузке деталей заявки');
  } finally {
    setDetailsLoading(false);
  }
};
  const fetchNomenclatures = async () => {
    try {
      console.log('Загрузка списка СИЗ...');
      const response = await api.get('/safety/nomenclatures/');
      console.log('Ответ от сервера:', response.data);
      const data = Array.isArray(response.data) ? response.data : [];
      setNomenclatures(data);
      console.log('Загружено СИЗ:', data.length);
    } catch (err: any) {
      console.error('Error fetching nomenclatures:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки СИЗ');
    }
  };

  const fetchStandardsData = async () => {
    try {
      console.log('Загрузка данных...');

      const [positionsRes, nomenclaturesRes, standardsRes] = await Promise.all([
        api.get('/admin/positions/get_all_positions/'),
        api.get('/safety/nomenclatures/', { params: { all: true } }),
        api.get('/safety/standards/'),
      ]);

      let nomenclaturesData = nomenclaturesRes.data;
      if (nomenclaturesRes.data && nomenclaturesRes.data.results) {
        nomenclaturesData = nomenclaturesRes.data.results;
      }
      if (nomenclaturesRes.data && nomenclaturesRes.data.data) {
        nomenclaturesData = nomenclaturesRes.data.data;
      }

      console.log('Loaded nomenclatures from safety API:', nomenclaturesData);

      setPositions(Array.isArray(positionsRes.data) ? positionsRes.data : []);
      setNomenclatures(Array.isArray(nomenclaturesData) ? nomenclaturesData : []);
      setAllStandards(Array.isArray(standardsRes.data) ? standardsRes.data : []);
    } catch (err: any) {
      console.error('Error fetching standards:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки данных норм');
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStandardsData();
    fetchNomenclatures();
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (selectedPosition && allStandards.length > 0) {
      const filtered = allStandards.filter(s => s.position_id === selectedPosition.position_id);
      setPositionStandards(filtered);
    } else {
      setPositionStandards([]);
    }
  }, [selectedPosition, allStandards]);

  const handleSelectPosition = (position: any) => {
    setSelectedPosition(position);
  };

  const handleBackToList = () => {
    setSelectedPosition(null);
    setSearchTerm('');
  };

  // Одобрение охраной труда
  const handleApproveBySafety = async (request: Request) => {
    setSubmitting(true);
    try {
      await api.post(`/requests/${request.request_id}/approve_by_safety/`, {
        comment: 'Одобрено отделом охраны труда'
      });
      setSuccess(`Заявка ${request.request_number} одобрена охраной труда`);
      fetchRequests();
      setViewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request by safety:', error);
      setError('Ошибка при одобрении заявки');
    } finally {
      setSubmitting(false);
    }
  };

  // Одобрение хоз. отделом
  const handleApproveByEconomic = async (request: Request) => {
    setSubmitting(true);
    try {
      await api.post(`/requests/${request.request_id}/approve_by_economic/`, {
        comment: 'Одобрено хозяйственным отделом'
      });
      setSuccess(`Заявка ${request.request_number} одобрена хоз. отделом`);
      fetchRequests();
      setViewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request by economic:', error);
      setError('Ошибка при одобрении заявки');
    } finally {
      setSubmitting(false);
    }
  };

  // Отклонение (общее)
  const handleReject = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      let endpoint = `/requests/${selectedRequest.request_id}/reject_by_safety/`;
      if (selectedRequest.status === 'hr_approved') {
        endpoint = `/requests/${selectedRequest.request_id}/reject_by_economic/`;
      }
      await api.post(endpoint, { comment: rejectComment });
      setSuccess(`Заявка ${selectedRequest.request_number} отклонена`);
      fetchRequests();
      setRejectDialogOpen(false);
      setRejectComment('');
      setViewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Ошибка при отклонении заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStandard = async () => {
    if (!standardForm.position_id || !standardForm.nomenclature_id) {
      setError('Выберите должность и СИЗ');
      return;
    }
    try {
      await api.post('/safety/standards/create_standard/', standardForm);
      setSuccess('Норма добавлена');
      fetchStandardsData();
      setStandardDialogOpen(false);
      resetStandardForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания');
    }
  };

  const handleUpdateStandard = async () => {
    if (!currentStandard) return;
    try {
      await api.put('/safety/standards/update_standard/', {
        standard_id: currentStandard.standard_id,
        quantity: standardForm.quantity,
        period_months: standardForm.period_months,
      });
      setSuccess('Норма обновлена');
      fetchStandardsData();
      setStandardDialogOpen(false);
      resetStandardForm();
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleDeleteStandard = async () => {
    if (!standardToDelete) return;
    try {
      await api.delete('/safety/standards/delete_standard/', { data: { standard_id: standardToDelete.standard_id } });
      setSuccess('Норма удалена');
      fetchStandardsData();
      setDeleteConfirmOpen(false);
      setStandardToDelete(null);
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const handleEditStandard = (standard: any) => {
    setCurrentStandard(standard);
    setStandardForm({
      position_id: standard.position_id,
      nomenclature_id: standard.nomenclature_id,
      quantity: standard.quantity,
      period_months: standard.period_months,
    });
    setEditMode(true);
    setStandardDialogOpen(true);
  };

  const handleAddStandardForPosition = () => {
    if (!selectedPosition) return;
    setStandardForm({
      position_id: selectedPosition.position_id,
      nomenclature_id: '',
      quantity: 1,
      period_months: 12,
    });
    setEditMode(false);
    setCurrentStandard(null);
    setStandardDialogOpen(true);
  };

  const resetStandardForm = () => {
    setStandardForm({
      position_id: '',
      nomenclature_id: '',
      quantity: 1,
      period_months: 12,
    });
    setCurrentStandard(null);
    setEditMode(false);
  };

  // Функции для работы с СИЗ
  const handleCreateNomenclature = async () => {
    if (!nomenclatureForm.title) {
      setError('Введите название СИЗ');
      return;
    }
    try {
      console.log('Создание СИЗ:', nomenclatureForm);
      const response = await api.post('/safety/nomenclatures/', {
        title: nomenclatureForm.title,
        unit: nomenclatureForm.unit,
        shelf_life_months: nomenclatureForm.shelf_life_months,
      });
      console.log('СИЗ создан:', response.data);

      setSuccess('СИЗ успешно создан');
      setNomenclatureDialogOpen(false);
      setNomenclatureForm({ title: '', unit: 'шт', shelf_life_months: 12 });

      await fetchNomenclatures();
      await fetchStandardsData();
    } catch (err: any) {
      console.error('Error creating nomenclature:', err);
      setError(err.response?.data?.error || 'Ошибка создания СИЗ');
    }
  };

  const handleUpdateNomenclature = async () => {
  if (!editingNomenclature) return;
  try {
    console.log('Обновление СИЗ:', editingNomenclature.nomenclature_id, nomenclatureForm);

    // Отправляем PUT запрос с ID в URL и данными в теле
    const response = await api.put(`/safety/nomenclatures/${editingNomenclature.nomenclature_id}/`, {
      title: nomenclatureForm.title,
      unit: nomenclatureForm.unit,
      shelf_life_months: nomenclatureForm.shelf_life_months,
    });

    console.log('СИЗ обновлен:', response.data);
    setSuccess('СИЗ обновлен');
    setNomenclatureEditDialogOpen(false);
    setEditingNomenclature(null);
    setNomenclatureForm({ title: '', unit: 'шт', shelf_life_months: 12 });
    await fetchNomenclatures();
    await fetchStandardsData();
  } catch (err: any) {
    console.error('Error updating nomenclature:', err);
    setError(err.response?.data?.error || 'Ошибка обновления СИЗ');
  }
};
  const handleEditNomenclature = (nomenclature: any) => {
    setEditingNomenclature(nomenclature);
    setNomenclatureForm({
      title: nomenclature.title,
      unit: nomenclature.unit,
      shelf_life_months: nomenclature.shelf_life_months,
    });
    setNomenclatureEditDialogOpen(true);
  };

  const handleDeleteNomenclature = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите деактивировать этот СИЗ? Он станет недоступен для выбора в нормах.')) {
      return;
    }
    try {
      console.log('Деактивация СИЗ:', id);
      await api.delete(`/api/safety/nomenclatures/${id}/`);
      setSuccess('СИЗ деактивирован');
      await fetchNomenclatures();
      await fetchStandardsData();
    } catch (err: any) {
      console.error('Error deleting nomenclature:', err);
      setError(err.response?.data?.error || 'Ошибка удаления СИЗ');
    }
  };

  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      pending: 'На рассмотрении (Охрана труда)',
      hr_approved: 'Одобрено охраной труда',
      approved: 'Одобрено хоз. отделом',
      rejected: 'Отклонена',
      ordered: 'Заказ сделан',
      completed: 'Выполнена',
      cancelled: 'Отозвана',
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'primary' | 'success' | 'default' => {
    const colors: Record<string, any> = {
      pending: 'warning',
      hr_approved: 'info',
      approved: 'success',
      rejected: 'error',
      ordered: 'primary',
      completed: 'success',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Охрана труда
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} onClick={() => { fetchRequests(); fetchStandardsData(); fetchNomenclatures(); }} variant="outlined">
            Обновить
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
              <Tab icon={<AssignmentIcon />} label="Заявки" />
              <Tab icon={<SafetyIcon />} label="Нормы выдачи СИЗ" />
              <Tab icon={<AddIcon />} label="Управление СИЗ" />
            </Tabs>

            {/* Вкладка заявок */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>№ заявки</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Цех</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Заявитель</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Создана</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">Нет заявок</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request.request_id} hover>
                          <TableCell>{request.request_number}</TableCell>
                          <TableCell>{request.shop_id || '-'}</TableCell>
                          <TableCell>{request.requester_name || '-'}</TableCell>
                          <TableCell>{request.title}</TableCell>
                          <TableCell>
                            <Chip label={getStatusText(request.status)} color={getStatusColor(request.status)} size="small" />
                          </TableCell>
                          <TableCell>{new Date(request.created_at).toLocaleDateString('ru-RU')}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Просмотр">
  <IconButton size="small" onClick={() => {
    setSelectedRequest(request);
    fetchRequestDetails(request.request_id);
  }}>
    <VisibilityIcon fontSize="small" />
  </IconButton>
</Tooltip>
                              {/* Для охраны труда - заявки в статусе pending */}
                              {request.status === 'pending' && userRole && userRole === 'safety_officer' && (
                                <>
                                  <Tooltip title="Одобрить">
                                    <IconButton size="small" color="success" onClick={() => handleApproveBySafety(request)} disabled={submitting}>
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Отклонить">
                                    <IconButton size="small" color="error" onClick={() => { setSelectedRequest(request); setRejectDialogOpen(true); }} disabled={submitting}>
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {/* Для хоз. отдела - заявки, одобренные охраной труда */}
                              {request.status === 'hr_approved' && userRole === 'economic_head' && (
                                <>
                                  <Tooltip title="Одобрить">
                                    <IconButton size="small" color="success" onClick={() => handleApproveByEconomic(request)} disabled={submitting}>
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Отклонить">
                                    <IconButton size="small" color="error" onClick={() => { setSelectedRequest(request); setRejectDialogOpen(true); }} disabled={submitting}>
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Вкладка норм выдачи СИЗ */}
            <TabPanel value={tabValue} index={1}>
              {!selectedPosition ? (
                <PositionsList
                  positions={positions}
                  onSelectPosition={handleSelectPosition}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              ) : (
                <PositionStandards
                  position={selectedPosition}
                  standards={positionStandards}
                  nomenclatures={nomenclatures}
                  onBack={handleBackToList}
                  onEditStandard={handleEditStandard}
                  onDeleteStandard={(id) => {
                    const std = positionStandards.find(s => s.standard_id === id);
                    if (std) {
                      setStandardToDelete(std);
                      setDeleteConfirmOpen(true);
                    }
                  }}
                  onAddStandard={handleAddStandardForPosition}
                  onAddNomenclature={() => setNomenclatureDialogOpen(true)}
                />
              )}
            </TabPanel>

            {/* Вкладка управления СИЗ */}
            <TabPanel value={tabValue} index={2}>
              <NomenclaturesList
                nomenclatures={nomenclatures}
                onEdit={handleEditNomenclature}
                onDelete={handleDeleteNomenclature}
                onCreate={() => {
                  setEditingNomenclature(null);
                  setNomenclatureForm({ title: '', unit: 'шт', shelf_life_months: 12 });
                  setNomenclatureDialogOpen(true);
                }}
              />
            </TabPanel>
          </CardContent>
        </Card>
{/* Диалог детального просмотра заявки */}
<Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); setRequestDetails(null); }} maxWidth="lg" fullWidth>
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Детали заявки {requestDetails?.request_number}
      </Typography>
      <IconButton onClick={() => { setViewDialogOpen(false); setRequestDetails(null); }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    {detailsLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    ) : requestDetails ? (
      <>
        {/* Основная информация */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Информация о заявке</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Номер заявки</Typography>
              <Typography variant="body1">{requestDetails.request_number}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Статус</Typography>
              <Chip label={getStatusText(requestDetails.status)} color={getStatusColor(requestDetails.status)} size="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Цех</Typography>
              <Typography variant="body1">{requestDetails.shop_name}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Заявитель</Typography>
              <Typography variant="body1">{requestDetails.requester_name}</Typography>
            </Box>
            <Box sx={{ gridColumn: '1/-1' }}>
              <Typography variant="subtitle2" color="text.secondary">Название заявки</Typography>
              <Typography variant="body1">{requestDetails.title}</Typography>
            </Box>
            {requestDetails.description && (
              <Box sx={{ gridColumn: '1/-1' }}>
                <Typography variant="subtitle2" color="text.secondary">Описание</Typography>
                <Typography variant="body1">{requestDetails.description}</Typography>
              </Box>
            )}
            <Box sx={{ gridColumn: '1/-1' }}>
              <Typography variant="subtitle2" color="text.secondary">Дата создания</Typography>
              <Typography variant="body1">{new Date(requestDetails.created_at).toLocaleString('ru-RU')}</Typography>
            </Box>
            {requestDetails.comment && (
              <Box sx={{ gridColumn: '1/-1' }}>
                <Typography variant="subtitle2" color="text.secondary">Комментарий</Typography>
                <Typography variant="body1">{requestDetails.comment}</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Сотрудники и их СИЗ */}
        <Typography variant="h6" sx={{ mb: 2 }}>Сотрудники и заказанные СИЗ</Typography>
        {requestDetails.employees.map((emp) => (
          <Card key={emp.employee_id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {emp.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {emp.position_name}
                  </Typography>
                </Box>
                {emp.height && (
                  <Chip label={`Рост: ${emp.height} см`} size="small" variant="outlined" />
                )}
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Количество</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Ед. изм.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emp.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.nomenclature_title}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
      </>
    ) : null}
  </DialogContent>
  <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
    <Button onClick={() => { setViewDialogOpen(false); setRequestDetails(null); }} variant="outlined">
      Закрыть
    </Button>
    {requestDetails?.status === 'pending' && userRole === 'safety_officer' && (
      <>
        <Button onClick={() => handleApproveBySafety(selectedRequest!)} variant="contained" color="success" disabled={submitting}>
          Одобрить
        </Button>
        <Button onClick={() => setRejectDialogOpen(true)} variant="contained" color="error" disabled={submitting}>
          Отклонить
        </Button>
      </>
    )}
    {requestDetails?.status === 'hr_approved' && userRole === 'economic_head' && (
      <>
        <Button onClick={() => handleApproveByEconomic(selectedRequest!)} variant="contained" color="success" disabled={submitting}>
          Одобрить
        </Button>
        <Button onClick={() => setRejectDialogOpen(true)} variant="contained" color="error" disabled={submitting}>
          Отклонить
        </Button>
      </>
    )}
  </DialogActions>
</Dialog>

        {/* Диалог отклонения заявки */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Отклонение заявки</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus margin="dense" label="Причина отклонения" fullWidth multiline rows={3}
              value={rejectComment} onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Укажите причину отклонения заявки" sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleReject} variant="contained" color="error" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Отклонить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог добавления/редактирования нормы */}
        <Dialog open={standardDialogOpen} onClose={() => setStandardDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Редактирование нормы' : 'Добавление нормы'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Должность</InputLabel>
                <Select
                  value={standardForm.position_id}
                  onChange={(e) => setStandardForm({ ...standardForm, position_id: e.target.value })}
                  label="Должность"
                  disabled={editMode}
                >
                  {positions.map((pos) => (<MenuItem key={pos.position_id} value={pos.position_id}>{pos.title}</MenuItem>))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>СИЗ</InputLabel>
                <Select
                  value={standardForm.nomenclature_id}
                  onChange={(e) => setStandardForm({ ...standardForm, nomenclature_id: e.target.value })}
                  label="СИЗ"
                >
                  <MenuItem value="">-- Выберите СИЗ --</MenuItem>
                  {nomenclatures && nomenclatures.map((nom) => (
                    <MenuItem key={nom.nomenclature_id} value={nom.nomenclature_id}>
                      {nom.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Количество"
                type="number"
                fullWidth
                value={standardForm.quantity}
                onChange={(e) => setStandardForm({ ...standardForm, quantity: parseFloat(e.target.value) })}
                slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
              />

              <TextField
                label="Период (месяцев)"
                type="number"
                fullWidth
                value={standardForm.period_months}
                onChange={(e) => setStandardForm({ ...standardForm, period_months: parseInt(e.target.value) })}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStandardDialogOpen(false)}>Отмена</Button>
            <Button onClick={editMode ? handleUpdateStandard : handleCreateStandard} variant="contained">
              {editMode ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог создания нового СИЗ */}
        <Dialog open={nomenclatureDialogOpen} onClose={() => setNomenclatureDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Создание нового СИЗ</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Название СИЗ *"
                fullWidth
                value={nomenclatureForm.title}
                onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, title: e.target.value })}
                placeholder="Например: Костюм зимний защитный"
                helperText="Введите уникальное название средства индивидуальной защиты"
              />

              <FormControl fullWidth>
                <InputLabel>Единица измерения</InputLabel>
                <Select
                  value={nomenclatureForm.unit}
                  onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, unit: e.target.value })}
                  label="Единица измерения"
                >
                  <MenuItem value="шт">штука (шт)</MenuItem>
                  <MenuItem value="пар">пара (пар)</MenuItem>
                  <MenuItem value="компл">комплект (компл)</MenuItem>
                  <MenuItem value="м">метр (м)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Срок службы (месяцев)"
                type="number"
                fullWidth
                value={nomenclatureForm.shelf_life_months}
                onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, shelf_life_months: parseInt(e.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 60 } }}
                helperText="Нормативный срок ношения (обычно 12-36 месяцев)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNomenclatureDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateNomenclature} variant="contained" color="primary">
              Создать СИЗ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог редактирования СИЗ */}
        <Dialog open={nomenclatureEditDialogOpen} onClose={() => setNomenclatureEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Редактирование СИЗ</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Название СИЗ *"
                fullWidth
                value={nomenclatureForm.title}
                onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, title: e.target.value })}
                placeholder="Например: Костюм зимний защитный"
              />

              <FormControl fullWidth>
                <InputLabel>Единица измерения</InputLabel>
                <Select
                  value={nomenclatureForm.unit}
                  onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, unit: e.target.value })}
                  label="Единица измерения"
                >
                  <MenuItem value="шт">штука (шт)</MenuItem>
                  <MenuItem value="пар">пара (пар)</MenuItem>
                  <MenuItem value="компл">комплект (компл)</MenuItem>
                  <MenuItem value="м">метр (м)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Срок службы (месяцев)"
                type="number"
                fullWidth
                value={nomenclatureForm.shelf_life_months}
                onChange={(e) => setNomenclatureForm({ ...nomenclatureForm, shelf_life_months: parseInt(e.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 60 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNomenclatureEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleUpdateNomenclature} variant="contained" color="primary">
              Сохранить изменения
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>
              Вы действительно хотите удалить норму выдачи для "{standardToDelete?.nomenclature_title}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
            <Button onClick={handleDeleteStandard} variant="contained" color="error">Удалить</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default SafetyDashboard;