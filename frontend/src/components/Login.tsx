import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import rtrsLogo from '../assets/images/RTRS_logo.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация на пустые поля
    if (!username.trim()) {
      setError('Введите логин');
      return;
    }
    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/simple-auth/', {
        username: username.trim(),
        password,
      });

      // Проверяем успешный ответ
      if (response.status === 200 && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token saved:', response.data.token);

        localStorage.setItem('user', JSON.stringify({
          username: response.data.username,
          user_id: response.data.user_id,
          is_superuser: response.data.is_superuser,
          role: response.data.role,
        }));

        navigate('/dashboard');
      } else {
        setError('Ошибка авторизации. Попробуйте позже.');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Обработка различных кодов ошибок
      if (err.response) {
        // Сервер вернул ответ с кодом ошибки
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 401:
            setError('Неверный логин или пароль');
            break;
          case 400:
            setError(data?.error || 'Неверный запрос. Проверьте введенные данные');
            break;
          case 404:
            setError('Сервис авторизации недоступен');
            break;
          case 500:
            setError('Ошибка на сервере. Попробуйте позже');
            break;
          default:
            setError(data?.error || data?.message || 'Неверный логин или пароль');
        }
      } else if (err.request) {
        // Запрос был сделан, но ответа не получено
        setError('Нет соединения с сервером. Проверьте подключение к интернету');
      } else {
        // Ошибка при настройке запроса
        setError('Произошла ошибка. Попробуйте позже');
      }
    } finally {
      setLoading(false);
    }
  };

  // Очистка ошибки при изменении полей
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a2b4e 0%, #1a3a6e 50%, #0d2b4a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper
            elevation={24}
            sx={{
              padding: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 4,
            }}
          >
            <Avatar
              src={rtrsLogo}
              sx={{
                width: 150,
                height: 150,
                mb: 1,
                backgroundColor: '#ffffff',
                '& img': {
                  objectFit: 'contain',
                }
              }}
            />
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1976d2',
                textAlign: 'center',
                width: '100%',
                mb: 1,
                whiteSpace: 'nowrap',
                fontSize: { xs: '2.9rem', sm: '2.9rem' }
              }}
            >
              ESM system
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, width: '100%', borderRadius: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Логин"
                value={username}
                onChange={handleUsernameChange}
                autoFocus
                disabled={loading}
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!error && error.includes('логин')}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Пароль"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!error && error.includes('пароль')}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;