import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import { requestsApi } from '../services/api';
import { Request } from '../types';
import Layout from './Layout';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await requestsApi.getById(Number(id));
        setRequest(response.data);
      } catch (error) {
        console.error('Error fetching request:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'primary' | 'success' => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      rejected: 'error',
      ordered: 'primary',
      completed: 'success',
    } as const;
    return colors[status as keyof typeof colors] || 'warning';
  };

  const getStatusText = (status: string): string => {
    const texts = {
      pending: 'На рассмотрении',
      approved: 'Одобрена',
      rejected: 'Отклонена',
      ordered: 'Заказ сделан',
      completed: 'Выполнена',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <Typography>Заявка не найдена</Typography>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Детали заявки #{request.request_number}
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Название</Typography>
            <Typography variant="h6">{request.title}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Описание</Typography>
            <Typography variant="body1">{request.description || '-'}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 4, mb: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Количество</Typography>
              <Typography variant="body1">{request.quantity} {request.unit}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Статус</Typography>
              <Chip label={getStatusText(request.status)} color={getStatusColor(request.status)} size="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Создана</Typography>
              <Typography variant="body1">{new Date(request.created_at).toLocaleString('ru-RU')}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Обновлена</Typography>
              <Typography variant="body1">{new Date(request.updated_at).toLocaleString('ru-RU')}</Typography>
            </Box>
          </Box>

          {request.status === 'ordered' && (
            <Box sx={{ display: 'flex', gap: 4, mb: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Поставщик</Typography>
                <Typography variant="body1">{request.supplier_name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Стоимость</Typography>
                <Typography variant="body1">{request.order_price} руб.</Typography>
              </Box>
            </Box>
          )}

          {request.comment && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Комментарий</Typography>
              <Typography variant="body1">{request.comment}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default RequestDetail;