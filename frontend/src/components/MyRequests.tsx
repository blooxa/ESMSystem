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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../services/api';
import api from '../services/api';
import { Request } from '../types';
import Layout from './Layout';

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

const MyRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Состояния для детального просмотра
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [requestDetails, setRequestDetails] = useState<RequestDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
  fetchRequests();
}, []);

// Исправленный useEffect — зависит от длины массива, а не от самого массива
useEffect(() => {
  if (requests.length === 0 && !searchTerm && statusFilter === 'all') return;
  
  let filtered = [...requests];
  
  if (searchTerm) {
    filtered = filtered.filter(
      (req) =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter((req) => req.status === statusFilter);
  }
  
  setFilteredRequests(filtered);
  setPage(1);
}, [searchTerm, statusFilter, requests.length]); 

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsApi.getMy();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
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
    } finally {
      setDetailsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
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

  const paginatedRequests = filteredRequests.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Мои заявки
        </Typography>

        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 2, minWidth: 200, position: 'relative' }}>
                <SearchIcon sx={{ position: 'absolute', left: 12, color: '#999', zIndex: 1 }} />
                <TextField
                  placeholder="Поиск по номеру или названию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      pl: 4,
                    }
                  }}
                />
                {searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ position: 'absolute', right: 8 }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Статус</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Статус">
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="pending">На рассмотрении</MenuItem>
                  <MenuItem value="hr_approved">Одобрено охраной труда</MenuItem>
                  <MenuItem value="approved">Одобрено хоз. отделом</MenuItem>
                  <MenuItem value="rejected">Отклонены</MenuItem>
                  <MenuItem value="ordered">Заказ сделан</MenuItem>
                  <MenuItem value="completed">Выполнены</MenuItem>
                </Select>
              </FormControl>

              {(searchTerm || statusFilter !== 'all') && (
                <Button onClick={clearFilters} size="small" variant="outlined">
                  Сбросить фильтры
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">
                  {requests.length === 0 ? 'У вас пока нет заявок' : 'Ничего не найдено по вашему запросу'}
                </Typography>
              </Box>
            ) : (
              <>
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
                      {paginatedRequests.map((request) => (
                        <TableRow key={request.request_id} hover sx={{ '& td': { py: 1 } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{request.request_number}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>{request.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {request.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={getStatusText(request.status)} color={getStatusColor(request.status)} size="small" sx={{ height: 24, fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(request.created_at).toLocaleDateString('ru-RU')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Просмотр деталей">
                                <IconButton size="small" onClick={() => fetchRequestDetails(request.request_id)} sx={{ color: '#1976d2' }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {request.status === 'rejected' && request.comment && (
                                <Tooltip title={`Причина отклонения: ${request.comment}`}>
                                  <InfoIcon fontSize="small" color="error" />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {filteredRequests.length > rowsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination count={Math.ceil(filteredRequests.length / rowsPerPage)} page={page} onChange={(_, value) => setPage(value)} color="primary" />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>

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
    </Layout>
  );
};

export default MyRequests;
