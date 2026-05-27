import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../services/api';
import api from '../services/api';
import { Request, DashboardStats } from '../types';
import CreateRequest from './CreateRequest';
import Layout from './Layout';
import EditRequest from './EditRequest';

// Интерфейс для деталей заявки
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    hr_approved: 0,
    approved: 0,
    rejected: 0,
    ordered: 0,
    completed: 0,
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', quantity: 1, unit: 'шт' });
  const [cancelComment, setCancelComment] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [selectedStat, setSelectedStat] = useState<{ title: string; status: string | null; requests: Request[] }>({
    title: '',
    status: null,
    requests: [],
  });

  // Состояния для детального просмотра
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [requestDetails, setRequestDetails] = useState<RequestDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsApi.getMy();
      setRequests(response.data);

      const pendingCount = response.data.filter((r: Request) => r.status === 'pending').length;
      const hrApprovedCount = response.data.filter((r: Request) => r.status === 'hr_approved').length;
      const approvedCount = response.data.filter((r: Request) => r.status === 'approved').length;
      const rejectedCount = response.data.filter((r: Request) => r.status === 'rejected').length;
      const orderedCount = response.data.filter((r: Request) => r.status === 'ordered').length;
      const completedCount = response.data.filter((r: Request) => r.status === 'completed').length;

      setStats({
        total: response.data.length,
        pending: pendingCount,
        hr_approved: hrApprovedCount,
        approved: approvedCount,
        rejected: rejectedCount,
        ordered: orderedCount,
        completed: completedCount,
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/users/me/');
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/api/requests/${requestId}/request_details/`);
      setRequestDetails(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError('Ошибка при загрузке деталей заявки');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUserInfo();
  }, []);

  const handleStatClick = (title: string, status: string | null) => {
    let filteredRequests: Request[] = [];

    if (status === null) {
      filteredRequests = requests;
    } else {
      filteredRequests = requests.filter((r: Request) => r.status === status);
    }

    setSelectedStat({
      title,
      status,
      requests: filteredRequests,
    });
    setStatsDialogOpen(true);
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
    return colors[status] || 'warning';
  };

  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      pending: 'На рассмотрении',
      hr_approved: 'Одобрено охраной труда',
      approved: 'Одобрено хоз. отделом',
      rejected: 'Отклонена',
      ordered: 'Заказ сделан',
      completed: 'Выполнена',
      cancelled: 'Отозвана',
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ScheduleIcon sx={{ fontSize: 20 }} />;
      case 'hr_approved': return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case 'approved': return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case 'ordered': return <ShoppingCartIcon sx={{ fontSize: 20 }} />;
      case 'completed': return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case 'rejected': return <CancelIcon sx={{ fontSize: 20 }} />;
      default: return <AssignmentIcon sx={{ fontSize: 20 }} />;
    }
  };

  const handleEditRequest = (request: Request) => {
    if (request.status !== 'pending') {
      setError('Можно редактировать только заявки в статусе "На рассмотрении"');
      return;
    }
    setEditingRequest(request);
    setEditForm({
      title: request.title,
      description: request.description || '',
      quantity: request.quantity,
      unit: request.unit,
    });
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (request: Request) => {
    if (request.status !== 'pending') {
      setError('Можно редактировать только заявки в статусе "На рассмотрении"');
      return;
    }
    setEditingRequestId(request.request_id);
    setEditRequestOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!editingRequest) return;

    try {
      await requestsApi.update(editingRequest.request_id, editForm);
      setSuccess('Заявка обновлена');
      fetchRequests();
      setEditDialogOpen(false);
      setEditingRequest(null);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleCancelRequest = async (request: Request) => {
    if (request.status !== 'pending') {
      setError('Можно отозвать только заявки в статусе "На рассмотрении"');
      return;
    }
    setEditingRequest(request);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!editingRequest) return;

    try {
      await requestsApi.cancel(editingRequest.request_id, cancelComment);
      setSuccess('Заявка отозвана');
      fetchRequests();
      setCancelDialogOpen(false);
      setEditingRequest(null);
      setCancelComment('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ошибка отзыва');
    }
  };

  // Исправленный StatCard с borderRadius: 2 (менее круглый)
  const StatCard = ({ title, value, icon, color, status }: any) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,  // Изменено с 3 на 2 для менее круглых углов
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        },
      }}
      onClick={() => handleStatClick(title, status)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Статистика
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 140px', minWidth: '120px' }}>
          <StatCard title="Всего" value={stats.total} icon={<AssignmentIcon />} color="#1976d2" status={null} />
        </Box>
        <Box sx={{ flex: '1 1 140px', minWidth: '120px' }}>
          <StatCard title="На рассмотрении" value={stats.pending} icon={<ScheduleIcon />} color="#ff9800" status="pending" />
        </Box>
        <Box sx={{ flex: '1 1 140px', minWidth: '120px' }}>
          <StatCard title="Заказы" value={stats.ordered} icon={<ShoppingCartIcon />} color="#9c27b0" status="ordered" />
        </Box>
        <Box sx={{ flex: '1 1 140px', minWidth: '120px' }}>
          <StatCard title="Выполнены" value={stats.completed} icon={<CheckCircleIcon />} color="#2e7d32" status="completed" />
        </Box>
        <Box sx={{ flex: '1 1 140px', minWidth: '120px' }}>
          <StatCard title="Отклонены" value={stats.rejected} icon={<CancelIcon />} color="#f44336" status="rejected" />
        </Box>
      </Box>

      <Card sx={{ borderRadius: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Мои заявки
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button startIcon={<RefreshIcon />} onClick={fetchRequests} variant="outlined">
                Обновить
              </Button>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setCreateDialogOpen(true)}
                sx={{ backgroundColor: '#1976d2' }}
              >
                Создать заявку
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>№ заявки</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Создана</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">У вас пока нет заявок</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow key={request.request_id} hover sx={{ '& td': { py: 1 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {request.request_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                            {request.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {request.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(request.status)}
                            color={getStatusColor(request.status)}
                            size="small"
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(request.created_at).toLocaleDateString('ru-RU')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Просмотр деталей">
                              <IconButton
                                size="small"
                                onClick={() => fetchRequestDetails(request.request_id)}
                                sx={{ color: '#1976d2' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {request.status === 'pending' && (
                              <>
                                <Tooltip title="Редактировать заявку">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(request)}
                                    sx={{ color: '#ff9800' }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Отозвать">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCancelRequest(request)}
                                    sx={{ color: '#f44336' }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {request.status === 'rejected' && request.comment && (
                              <Tooltip title={`Причина отклонения: ${request.comment}`}>
                                <InfoIcon fontSize="small" color="error" />
                              </Tooltip>
                            )}
                          </Box>
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

      <CreateRequest
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchRequests}
        userRole={userRole}
      />
      <EditRequest
        open={editRequestOpen}
        requestId={editingRequestId || 0}
        onClose={() => {
          setEditRequestOpen(false);
          setEditingRequestId(null);
        }}
        onSuccess={() => {
          fetchRequests();
          setSuccess('Заявка успешно обновлена');
        }}
      />
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

              <Typography variant="h6" sx={{ mb: 2 }}>Сотрудники и заказанные СИЗ</Typography>
              {requestDetails.employees.map((emp) => (
                <Card key={emp.employee_id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{emp.full_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{emp.position_name}</Typography>
                      </Box>
                      {emp.height && <Chip label={`Рост: ${emp.height} см`} size="small" variant="outlined" />}
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
          <Button onClick={() => { setViewDialogOpen(false); setRequestDetails(null); }} variant="outlined">Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог со статистикой */}
      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedStat.title} ({selectedStat.requests.length})
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStat.requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">Нет заявок в этой категории</Typography>
            </Box>
          ) : (
            <List>
              {selectedStat.requests.map((request, index) => (
                <React.Fragment key={request.request_id}>
                  <ListItem sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getStatusColor(request.status) }}>
                        {getStatusIcon(request.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{request.request_number}</Typography>
                          <Chip label={getStatusText(request.status)} color={getStatusColor(request.status)} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.primary">{request.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Создана: {new Date(request.created_at).toLocaleString('ru-RU')}
                          </Typography>
                          {request.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {request.description.length > 100 ? request.description.substring(0, 100) + '...' : request.description}
                            </Typography>
                          )}
                          {request.status === 'rejected' && request.comment && (
                            <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                              Причина отклонения: {request.comment}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <IconButton edge="end" size="small" onClick={() => fetchRequestDetails(request.request_id)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < selectedStat.requests.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setStatsDialogOpen(false)} variant="outlined">Закрыть</Button>
          <Button onClick={fetchRequests} variant="contained" sx={{ bgcolor: '#1976d2' }}>Обновить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактирование заявки</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Название заявки"
              fullWidth
              value={editForm.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Количество"
                type="number"
                fullWidth
                value={editForm.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
              />
              <TextField
                label="Единица измерения"
                fullWidth
                value={editForm.unit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, unit: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleUpdateRequest} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отзыва заявки */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отзыв заявки</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина отзыва"
            fullWidth
            multiline
            rows={3}
            value={cancelComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelComment(e.target.value)}
            placeholder="Укажите причину отзыва (необязательно)"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleConfirmCancel} variant="contained" color="error">Отозвать заявку</Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default Dashboard;