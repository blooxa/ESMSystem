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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Tooltip,
  Checkbox,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentInd as AssignmentIndIcon,
} from '@mui/icons-material';
import { reportsApi } from '../services/api';
import api from '../services/api';
import { Request } from '../types';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';

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
  supplier_name?: string;
  order_price?: number;
  order_date?: string;
  employees: {
    employee_id: number;
    full_name: string;
    position_name: string;
    height: number | null;
    items: {
      nomenclature_id: number;
      nomenclature_title: string;
      size: string;
      quantity: number;
      unit: string;
    }[];
  }[];
}

interface OrderItem {
  employee_id: number;
  employee_name: string;
  nomenclature_id: number;
  nomenclature_title: string;
  size: string;
  quantity: number;
  unit: string;
  is_ordered: boolean;
}

interface DeliveryItem {
  employee_id: number;
  employee_name: string;
  nomenclature_id: number;
  nomenclature_title: string;
  size: string;
  quantity: number;
  unit: string;
  is_delivered: boolean;
}

interface IssueItem {
  employee_id: number;
  employee_name: string;
  nomenclature_id: number;
  nomenclature_title: string;
  size: string;
  quantity: number;
  unit: string;
  period_months: number;
  is_issued: boolean;
}

const EconomicDashboard: React.FC = () => {
  const [hrApprovedRequests, setHrApprovedRequests] = useState<Request[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<Request[]>([]);
  const [orderedRequests, setOrderedRequests] = useState<Request[]>([]);
  const [completedRequests, setCompletedRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'hr_approved' | 'approved' | 'ordered' | 'completed' | 'all'>('all');
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [issueItems, setIssueItems] = useState<IssueItem[]>([]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [issueComment, setIssueComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hr_approved: 0,
    approved: 0,
    rejected: 0,
    ordered: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{ title: string; status: string; requests: Request[] }>({
    title: '',
    status: '',
    requests: [],
  });

  const fetchRequests = async () => {
  try {
    setLoading(true);
    console.log('=== FETCHING REQUESTS ===');

    const response = await api.get('/requests/');
    console.log('RAW response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    let allData: Request[] = [];

    // Проверяем структуру ответа
    if (Array.isArray(response.data)) {
      allData = response.data;
      console.log('Data is array, length:', allData.length);
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      allData = response.data.results;
      console.log('Data is paginated results, length:', allData.length);
    } else if (response.data && typeof response.data === 'object') {
      // Если это объект, но не массив и не results
      console.log('Response data is object, keys:', Object.keys(response.data));
      // Пробуем найти массив в любом поле
      for (const key of Object.keys(response.data)) {
        if (Array.isArray(response.data[key])) {
          allData = response.data[key];
          console.log(`Found array in field '${key}', length:`, allData.length);
          break;
        }
      }
    }

    if (allData.length === 0) {
      console.warn('No data found in response!');
    }

    console.log('Total requests from API:', allData.length);
    if (allData.length > 0) {
      console.log('First request example:', allData[0]);
      console.log('All statuses:', allData.map(r => r.status));
    }

    const hrApproved = allData.filter((r: Request) => r.status === 'hr_approved');
    const approved = allData.filter((r: Request) => r.status === 'approved');
    const ordered = allData.filter((r: Request) => r.status === 'ordered');
    const completed = allData.filter((r: Request) => r.status === 'completed');

    console.log('Filtered results:', {
      hr_approved: hrApproved.length,
      approved: approved.length,
      ordered: ordered.length,
      completed: completed.length,
    });

    setHrApprovedRequests(hrApproved);
    setApprovedRequests(approved);
    setOrderedRequests(ordered);
    setCompletedRequests(completed);
    setAllRequests(allData);

    setStats({
      hr_approved: hrApproved.length,
      approved: approved.length,
      rejected: allData.filter((r: Request) => r.status === 'rejected').length,
      ordered: ordered.length,
      delivered: allData.filter((r: Request) => r.status === 'delivered').length,
      completed: completed.length,
      cancelled: allData.filter((r: Request) => r.status === 'cancelled').length,
      total: allData.length,
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    console.error('Error response:', error.response);
    setError(`Ошибка загрузки: ${error.response?.data?.error || error.message}`);
    setHrApprovedRequests([]);
    setApprovedRequests([]);
    setAllRequests([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    console.log('=== CURRENT STATE ===');
    console.log('hrApprovedRequests:', hrApprovedRequests);
    console.log('approvedRequests:', approvedRequests);
    console.log('orderedRequests:', orderedRequests);
    console.log('completedRequests:', completedRequests);
    console.log('viewMode:', viewMode);
  }, [hrApprovedRequests, approvedRequests, orderedRequests, completedRequests, viewMode]);

  const fetchRequestDetails = async (requestId: number) => {
    setDetailsLoading(true);
    try {
      console.log('Fetching details for request ID:', requestId);
      const response = await api.get(`/requests/${requestId}/request_details/`);
      console.log('Request details response:', response.data);
      setRequestDetails(response.data);

      if (response.data.status === 'approved') {
        prepareOrderItems(response.data);
      } else if (response.data.status === 'ordered') {
        prepareDeliveryItems(response.data);
      } else if (response.data.status === 'delivered') {
        prepareIssueItems(response.data);
      }

      setViewDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      if (error.response?.status === 400) {
        setError('Заявка не найдена или была удалена');
      } else {
        setError(error.response?.data?.error || 'Ошибка при загрузке деталей заявки');
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleGoToIssue = async (request: Request) => {
    setSelectedRequest(request);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/requests/${request.request_id}/request_details/`);
      const details = response.data;

      const issueData = {
        request_id: request.request_id,
        request_number: request.request_number,
        employees: details.employees.map((emp: any) => ({
          employee_id: emp.employee_id,
          full_name: emp.full_name,
          position_name: emp.position_name,
          height: emp.height,
          items: emp.items.map((item: any) => ({
            nomenclature_id: item.nomenclature_id,
            nomenclature_title: item.nomenclature_title,
            size: item.size,
            quantity: item.quantity,
            unit: item.unit,
            period_months: 12,
            selected: true,
          })),
        })),
      };

      localStorage.setItem('mass_issue_from_request', JSON.stringify(issueData));
      navigate('/mass-issue');
    } catch (error) {
      console.error('Error loading request for issue:', error);
      setError('Ошибка при загрузке данных для выдачи СИЗ');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenDeliveryDialog = async (request: Request) => {
    setSelectedRequest(request);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/requests/${request.request_id}/request_details/`);
      prepareDeliveryItems(response.data);
      setDeliveryDialogOpen(true);
    } catch (error) {
      console.error('Error loading request for delivery:', error);
      setError('Ошибка при загрузке данных для доставки');
    } finally {
      setDetailsLoading(false);
    }
  };

  const prepareOrderItems = (request: RequestDetail) => {
    const items: OrderItem[] = [];
    request.employees.forEach(emp => {
      emp.items.forEach(item => {
        items.push({
          employee_id: emp.employee_id,
          employee_name: emp.full_name,
          nomenclature_id: item.nomenclature_id,
          nomenclature_title: item.nomenclature_title,
          size: item.size,
          quantity: item.quantity,
          unit: item.unit,
          is_ordered: false,
        });
      });
    });
    setOrderItems(items);
  };

  const prepareDeliveryItems = (request: RequestDetail) => {
    const items: DeliveryItem[] = [];
    request.employees.forEach(emp => {
      emp.items.forEach(item => {
        items.push({
          employee_id: emp.employee_id,
          employee_name: emp.full_name,
          nomenclature_id: item.nomenclature_id,
          nomenclature_title: item.nomenclature_title,
          size: item.size,
          quantity: item.quantity,
          unit: item.unit,
          is_delivered: false,
        });
      });
    });
    setDeliveryItems(items);
  };

  const prepareIssueItems = (request: RequestDetail) => {
    const items: IssueItem[] = [];
    request.employees.forEach(emp => {
      emp.items.forEach(item => {
        items.push({
          employee_id: emp.employee_id,
          employee_name: emp.full_name,
          nomenclature_id: item.nomenclature_id,
          nomenclature_title: item.nomenclature_title,
          size: item.size,
          quantity: item.quantity,
          unit: item.unit,
          period_months: 12,
          is_issued: false,
        });
      });
    });
    setIssueItems(items);
  };

  const getDisplayRequests = () => {
    if (viewMode === 'hr_approved') {
      return hrApprovedRequests;
    } else if (viewMode === 'approved') {
      return approvedRequests;
    } else if (viewMode === 'ordered') {
      return orderedRequests;
    } else if (viewMode === 'completed') {
      return completedRequests;
    } else {
      return allRequests;
    }
  };

  const handleMarkOrdered = async () => {
    if (!selectedRequest) return;

    const selectedItems = orderItems.filter(item => item.is_ordered);
    if (selectedItems.length === 0) {
      setError('Отметьте хотя бы одну позицию как заказанную');
      return;
    }

    if (!supplierName) {
      setError('Укажите поставщика');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/requests/${selectedRequest.request_id}/mark_ordered/`, {
        supplier_name: supplierName,
        order_price: orderPrice ? parseFloat(orderPrice) : null,
        comment: orderComment,
        ordered_items: selectedItems.map(item => ({
          employee_id: item.employee_id,
          nomenclature_id: item.nomenclature_id,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      setSuccess('Заказ оформлен');
      setOrderDialogOpen(false);
      setSupplierName('');
      setOrderPrice('');
      setOrderComment('');
      setOrderItems([]);
      await fetchRequests();
      if (selectedRequest) {
        await fetchRequestDetails(selectedRequest.request_id);
      }
    } catch (error) {
      console.error('Error marking ordered:', error);
      setError('Ошибка при оформлении заказа');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedRequest) return;

    const selectedItems = deliveryItems.filter(item => item.is_delivered);
    if (selectedItems.length === 0) {
      setError('Отметьте хотя бы одну позицию как поступившую на склад');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/requests/${selectedRequest.request_id}/mark_delivered/`, {
        comment: deliveryComment,
        delivered_items: selectedItems.map(item => ({
          employee_id: item.employee_id,
          nomenclature_id: item.nomenclature_id,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      setSuccess('Доставка отмечена');
      setDeliveryDialogOpen(false);
      setDeliveryComment('');
      setDeliveryItems([]);
      await fetchRequests();
      if (selectedRequest) {
        await fetchRequestDetails(selectedRequest.request_id);
      }
    } catch (error) {
      console.error('Error marking delivered:', error);
      setError('Ошибка при отметке доставки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssuePpe = async () => {
  if (!selectedRequest) return;

  const selectedItems = issueItems.filter(item => item.is_issued);
  if (selectedItems.length === 0) {
    setError('Отметьте хотя бы одну позицию для выдачи');
    return;
  }

  for (const item of selectedItems) {
    if (!item.period_months || item.period_months <= 0) {
      setError(`Укажите срок службы для ${item.nomenclature_title}`);
      return;
    }
  }

  setSubmitting(true);
  try {
    await api.post(`/requests/${selectedRequest.request_id}/issue_ppe/`, {
      issue_date: issueDate,
      comment: issueComment,
      issued_items: selectedItems.map(item => ({
        employee_id: item.employee_id,
        nomenclature_id: item.nomenclature_id,
        size: item.size,
        quantity: item.quantity,
        period_months: item.period_months,
      })),
    });

    // Дополнительно обновляем статус заявки на completed
    await api.post(`/requests/${selectedRequest.request_id}/complete/`, {
      comment: 'СИЗ выданы'
    });

    setSuccess('СИЗ выданы');
    setIssueDialogOpen(false);
    setIssueComment('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIssueItems([]);
    await fetchRequests();
    if (selectedRequest) {
      await fetchRequestDetails(selectedRequest.request_id);
    }
  } catch (error) {
    console.error('Error issuing PPE:', error);
    setError('Ошибка при выдаче СИЗ');
  } finally {
    setSubmitting(false);
  }
};

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (orderDialogOpen && selectedRequest) {
      const loadOrderItems = async () => {
        setDetailsLoading(true);
        try {
          console.log('Loading order items for request:', selectedRequest.request_id);
          const response = await api.get(`/requests/${selectedRequest.request_id}/request_details/`);
          console.log('Order items response:', response.data);
          prepareOrderItems(response.data);
        } catch (error) {
          console.error('Error loading order items:', error);
          setError('Ошибка при загрузке данных для заказа');
        } finally {
          setDetailsLoading(false);
        }
      };
      loadOrderItems();
    }
  }, [orderDialogOpen, selectedRequest]);

  const handleStatClick = (title: string, status: string) => {
    let filteredRequests: Request[] = [];

    if (status === 'all') {
      filteredRequests = allRequests;
    } else if (status === 'approved') {
      filteredRequests = approvedRequests;
    } else if (status === 'ordered') {
      filteredRequests = orderedRequests;
    } else if (status === 'completed') {
      filteredRequests = completedRequests;
    } else {
      filteredRequests = allRequests.filter((r: Request) => r.status === status);
    }

    setSelectedStat({
      title,
      status,
      requests: filteredRequests,
    });
    setStatsDialogOpen(true);
  };

  const handleApproveByEconomic = async (request: Request) => {
    setSubmitting(true);
    try {
      console.log('Approving request:', request.request_id);
      const response = await api.post(`/requests/${request.request_id}/approve_by_economic/`, {
        comment: approveComment
      });
      console.log('Approve response:', response.data);

      await fetchRequests();

      setApproveDialogOpen(false);
      setApproveComment('');
      setViewDialogOpen(false);
      setRequestDetails(null);
      setSelectedRequest(null);
      setSuccess('Заявка одобрена');
    } catch (error: any) {
      console.error('Error approving request by economic:', error);
      setError(error.response?.data?.error || 'Ошибка при одобрении заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectByEconomic = async (request: Request) => {
    setSubmitting(true);
    try {
      await api.post(`/requests/${request.request_id}/reject_by_economic/`, {
        comment: rejectComment
      });
      await fetchRequests();
      setRejectDialogOpen(false);
      setRejectComment('');
      setViewDialogOpen(false);
      setRequestDetails(null);
      setSelectedRequest(null);
      setSuccess('Заявка отклонена');
    } catch (error: any) {
      console.error('Error rejecting request by economic:', error);
      setError(error.response?.data?.error || 'Ошибка при отклонении заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await reportsApi.getConsolidatedReport();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consolidated_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'primary' | 'success' | 'default' => {
    const colors: Record<string, any> = {
      pending: 'warning',
      hr_approved: 'info',
      approved: 'success',
      ordered: 'primary',
      delivered: 'info',
      completed: 'success',
      rejected: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      pending: 'На рассмотрении (Охрана труда)',
      hr_approved: 'Одобрено охраной труда',
      approved: 'Одобрено хоз. отделом',
      ordered: 'Заказ сделан',
      delivered: 'Доставлено на склад',
      completed: 'Выполнена',
      rejected: 'Отклонена',
      cancelled: 'Отозвана',
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ScheduleIcon />;
      case 'hr_approved': return <CheckCircleIcon />;
      case 'approved': return <CheckCircleIcon />;
      case 'ordered': return <ShoppingCartIcon />;
      case 'delivered': return <LocalShippingIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      case 'cancelled': return <CloseIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const StatCard = ({ title, value, icon, color, status }: any) => (
    <Card
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        },
      }}
      onClick={() => handleStatClick(title, status)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const displayRequests = getDisplayRequests();

  return (
    <Layout>
      {/* Статистика */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Статистика
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <StatCard title="Одобрено Охраной Труда" value={stats.hr_approved} icon={<CheckCircleIcon />} color="#2196f3" status="hr_approved" />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <StatCard title="Одобрено Хозяйственным отделом" value={stats.approved} icon={<CheckCircleIcon />} color="#4caf50" status="approved" />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <StatCard title="Заказы" value={stats.ordered} icon={<ShoppingCartIcon />} color="#9c27b0" status="ordered" />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <StatCard title="Выполнено" value={stats.completed} icon={<CheckCircleIcon />} color="#2e7d32" status="completed" />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={viewMode === 'hr_approved' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('hr_approved')}
          startIcon={<ScheduleIcon />}
        >
          На рассмотрении ХО ({stats.hr_approved})
        </Button>
        <Button
          variant={viewMode === 'approved' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('approved')}
          startIcon={<CheckCircleIcon />}
        >
          Одобрено ХО ({stats.approved})
        </Button>
        <Button
          variant={viewMode === 'ordered' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('ordered')}
          startIcon={<ShoppingCartIcon />}
        >
          Заказы ({stats.ordered})
        </Button>
        <Button
          variant={viewMode === 'completed' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('completed')}
          startIcon={<AssignmentIndIcon />}
        >
          Выполнено ({stats.completed})
        </Button>
        <Button
          variant={viewMode === 'all' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('all')}
          startIcon={<AssignmentIcon />}
        >
          Все заявки ({stats.total})
        </Button>
      </Box>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {viewMode === 'hr_approved' ? 'Заявки, одобренные охраной труда (ожидают решения ХО)' :
              viewMode === 'approved' ? 'Заявки, одобренные хоз. отделом (требуют заказа)' :
                viewMode === 'ordered' ? 'Заказы (ожидают доставки)' :
                  viewMode === 'completed' ? 'Выполненные заявки' : 'Все заявки'}
          </Typography>
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
                    <TableCell sx={{ fontWeight: 600 }}>Цех</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Заявитель</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Создана</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Нет заявок в этой категории</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRequests.map((request) => (
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
                            <Tooltip title="Просмотр деталей">
                              <IconButton size="small" onClick={() => {
                                setSelectedRequest(request);
                                fetchRequestDetails(request.request_id);
                              }}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {request.status === 'hr_approved' && (
                              <>
                                <Tooltip title="Одобрить">
                                  <IconButton size="small" color="success" onClick={() => {
                                    setSelectedRequest(request);
                                    setApproveDialogOpen(true);
                                  }}>
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Отклонить">
                                  <IconButton size="small" color="error" onClick={() => {
                                    setSelectedRequest(request);
                                    setRejectDialogOpen(true);
                                  }}>
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                            {request.status === 'approved' && (
                              <Tooltip title="Оформить заказ">
                                <IconButton size="small" color="primary" onClick={async () => {
                                  setSelectedRequest(request);
                                  setDetailsLoading(true);
                                  try {
                                    const response = await api.get(`/requests/${request.request_id}/request_details/`);
                                    prepareOrderItems(response.data);
                                    setOrderDialogOpen(true);
                                  } catch (error) {
                                    console.error('Error loading request details:', error);
                                    setError('Ошибка при загрузке деталей заявки');
                                  } finally {
                                    setDetailsLoading(false);
                                  }
                                }}>
                                  <ShoppingCartIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {request.status === 'ordered' && (
                              <>

                               <Tooltip title="Выдать СИЗ">
      <IconButton size="small" color="success" onClick={() => handleGoToIssue(request)}>
        <AssignmentIndIcon fontSize="small" />
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
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadReport} sx={{ bgcolor: '#1976d2' }}>
          Скачать сводный отчет
        </Button>
      </Box>

      {/* Диалог статистики */}
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
                            Цех: {request.shop_id || 'Не указан'} | Заявитель: {request.requester_name || 'Не указан'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Создана: {new Date(request.created_at).toLocaleString('ru-RU')}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton edge="end" size="small" onClick={() => {
                      setStatsDialogOpen(false);
                      setSelectedRequest(request);
                      fetchRequestDetails(request.request_id);
                    }}>
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
                  <Box><Typography variant="subtitle2" color="text.secondary">Номер заявки</Typography><Typography variant="body1">{requestDetails.request_number}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">Статус</Typography><Chip label={getStatusText(requestDetails.status)} color={getStatusColor(requestDetails.status)} size="small" /></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">Цех</Typography><Typography variant="body1">{requestDetails.shop_name}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">Заявитель</Typography><Typography variant="body1">{requestDetails.requester_name}</Typography></Box>
                  <Box sx={{ gridColumn: '1/-1' }}><Typography variant="subtitle2" color="text.secondary">Название заявки</Typography><Typography variant="body1">{requestDetails.title}</Typography></Box>
                  {requestDetails.description && (<Box sx={{ gridColumn: '1/-1' }}><Typography variant="subtitle2" color="text.secondary">Описание</Typography><Typography variant="body1">{requestDetails.description}</Typography></Box>)}
                  <Box sx={{ gridColumn: '1/-1' }}><Typography variant="subtitle2" color="text.secondary">Дата создания</Typography><Typography variant="body1">{new Date(requestDetails.created_at).toLocaleString('ru-RU')}</Typography></Box>
                  {requestDetails.comment && (<Box sx={{ gridColumn: '1/-1' }}><Typography variant="subtitle2" color="text.secondary">Комментарий</Typography><Typography variant="body1">{requestDetails.comment}</Typography></Box>)}
                </Box>
              </Paper>

              <Typography variant="h6" sx={{ mb: 2 }}>Сотрудники и заказанные СИЗ</Typography>
              {requestDetails.employees.map((emp) => (
                <Card key={emp.employee_id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{emp.full_name}</Typography><Typography variant="body2" color="text.secondary">{emp.position_name}</Typography></Box>
                      {emp.height && <Chip label={`Рост: ${emp.height} см`} size="small" variant="outlined" />}
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#fafafa' }}><TableRow><TableCell sx={{ fontWeight: 600 }}>СИЗ</TableCell><TableCell sx={{ fontWeight: 600 }}>Размер</TableCell><TableCell sx={{ fontWeight: 600 }}>Количество</TableCell><TableCell sx={{ fontWeight: 600 }}>Ед. изм.</TableCell></TableRow></TableHead>
                        <TableBody>
                          {emp.items.map((item, idx) => (<TableRow key={idx}><TableCell>{item.nomenclature_title}</TableCell><TableCell>{item.size}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.unit}</TableCell></TableRow>))}
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
          {requestDetails?.status === 'hr_approved' && (
            <>
              <Button onClick={() => { setApproveDialogOpen(true); }} variant="contained" color="success" disabled={submitting}>
                Одобрить
              </Button>
              <Button onClick={() => setRejectDialogOpen(true)} variant="contained" color="error" disabled={submitting}>
                Отклонить
              </Button>
            </>
          )}
          {requestDetails?.status === 'approved' && (
            <Button onClick={() => setOrderDialogOpen(true)} variant="contained" sx={{ bgcolor: '#9c27b0' }} disabled={submitting}>
              Оформить заказ
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Диалог оформления заказа */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Оформление заказа - {selectedRequest?.request_number}
            </Typography>
            <IconButton onClick={() => setOrderDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField
                  label="Поставщик *"
                  fullWidth
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
                <TextField
                  label="Комментарий к заказу"
                  fullWidth
                  multiline
                  rows={2}
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Отметьте СИЗ, которые были заказаны:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const newItems = orderItems.map(item => ({ ...item, is_ordered: true }));
                      setOrderItems(newItems);
                    }}
                  >
                    Выбрать все
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const newItems = orderItems.map(item => ({ ...item, is_ordered: false }));
                      setOrderItems(newItems);
                    }}
                  >
                    Снять все
                  </Button>
                </Box>
              </Box>

              {orderItems.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Нет позиций для заказа
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                      <TableRow>
                        <TableCell sx={{ width: 50 }}>
                          <Checkbox
                            checked={orderItems.length > 0 && orderItems.every(item => item.is_ordered)}
                            indeterminate={orderItems.some(item => item.is_ordered) && !orderItems.every(item => item.is_ordered)}
                            onChange={(e) => {
                              const newItems = orderItems.map(item => ({ ...item, is_ordered: e.target.checked }));
                              setOrderItems(newItems);
                            }}
                          />
                        </TableCell>
                        <TableCell>Сотрудник</TableCell>
                        <TableCell>СИЗ</TableCell>
                        <TableCell>Размер</TableCell>
                        <TableCell>Количество</TableCell>
                        <TableCell>Ед. изм.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Checkbox
                              checked={item.is_ordered}
                              onChange={(e) => {
                                const newItems = [...orderItems];
                                newItems[idx].is_ordered = e.target.checked;
                                setOrderItems(newItems);
                              }}
                            />
                          </TableCell>
                          <TableCell>{item.employee_name}</TableCell>
                          <TableCell>{item.nomenclature_title}</TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                * После оформления заказа, заявка переместится во вкладку "Заказы"
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOrderDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleMarkOrdered}
            variant="contained"
            disabled={!supplierName || orderItems.filter(i => i.is_ordered).length === 0 || submitting || detailsLoading}
          >
            {submitting ? <CircularProgress size={24} /> : 'Оформить заказ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог одобрения */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Одобрение заявки</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Комментарий (необязательно)" fullWidth multiline rows={3} value={approveComment} onChange={(e) => setApproveComment(e.target.value)} placeholder="Введите комментарий к одобрению" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Отмена</Button>
          <Button onClick={() => selectedRequest && handleApproveByEconomic(selectedRequest)} variant="contained" color="success" disabled={submitting}>{submitting ? <CircularProgress size={24} /> : 'Одобрить'}</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отклонения */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отклонение заявки</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Причина отклонения" fullWidth multiline rows={3} value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Укажите причину отклонения" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Отмена</Button>
          <Button onClick={() => selectedRequest && handleRejectByEconomic(selectedRequest)} variant="contained" color="error" disabled={submitting}>{submitting ? <CircularProgress size={24} /> : 'Отклонить'}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default EconomicDashboard;