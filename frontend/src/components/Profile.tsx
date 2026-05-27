import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Factory as FactoryIcon,
} from '@mui/icons-material';
import { usersApi } from '../services/api';
import Layout from './Layout';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  role?: string;
  shop_id?: number;
  shop_name?: string;
  full_name?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await usersApi.getMe();
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getRoleText = (role?: string) => {
    switch (role) {
      case 'department_head':
        return 'Начальник цеха';
      case 'economic_head':
        return 'Начальник хозяйственного отдела';
      default:
        return 'Пользователь';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'department_head':
        return '#ff9800';
      case 'economic_head':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
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

  if (error || !profile) {
    return (
      <Layout>
        <Alert severity="error" sx={{ m: 2 }}>{error || 'Профиль не найден'}</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Мой профиль
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Левая колонка - аватар и основная информация */}
          <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#1976d2',
                    fontSize: 48,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {(profile.full_name || profile.username)[0].toUpperCase()}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  @{profile.username}
                </Typography>
                <Chip
                  label={getRoleText(profile.role)}
                  sx={{
                    bgcolor: getRoleColor(profile.role),
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
                {profile.is_superuser && (
                  <Chip
                    icon={<AdminIcon />}
                    label="Администратор"
                    sx={{ ml: 1, bgcolor: '#f44336', color: 'white' }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Правая колонка - детальная информация */}
          <Box sx={{ flex: '2 1 500px', minWidth: 400 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: '#1976d2', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Личная информация
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Имя пользователя
                    </Typography>
                    <Typography variant="body1">{profile.username}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{profile.email || 'Не указан'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Имя
                    </Typography>
                    <Typography variant="body1">{profile.first_name || 'Не указано'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Фамилия
                    </Typography>
                    <Typography variant="body1">{profile.last_name || 'Не указана'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
                  <BusinessIcon sx={{ color: '#1976d2', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Информация о работе
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Роль
                    </Typography>
                    <Chip
                      label={getRoleText(profile.role)}
                      size="small"
                      sx={{ mt: 0.5, bgcolor: getRoleColor(profile.role), color: 'white' }}
                    />
                  </Box>
                  {profile.shop_name && (
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Цех
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <FactoryIcon sx={{ fontSize: 16, color: '#666', mr: 0.5 }} />
                        <Typography variant="body2">{profile.shop_name}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Profile;