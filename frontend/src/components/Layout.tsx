import React, { useState } from 'react';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Factory as FactoryIcon,
  Receipt as ReceiptIcon,
  Security as SafetyIcon,
  Inventory as InventoryIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import rtrsLogo from '../assets/images/RTRS_logo.png';
interface LayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const isSuperuser = user.is_superuser === true;

  // Функция для проверки прав доступа к пункту меню
  const canSee = (roles: string[]) => {
    if (isSuperuser) return true; // Админ видит всё
    return roles.includes(userRole);
  };

  const menuItems = [
    // Дашборд - видят все
    { text: 'Статистика', icon: <DashboardIcon />, path: '/dashboard', roles: ['user', 'department_head', 'economic_head', 'safety_officer'] },

    // Мои заявки - видят все
    { text: 'Мои заявки', icon: <AssignmentIcon />, path: '/my-requests', roles: ['user', 'department_head', 'economic_head', 'safety_officer'] },

    // Сотрудники - начальник цеха и админ
    { text: 'Сотрудники', icon: <PersonIcon />, path: '/employees', roles: ['department_head', 'admin'] },

    // Заявки на рассмотрении - только хоз. отдел
    { text: 'Заявки на рассмотрении', icon: <ShoppingCartIcon />, path: '/economic', roles: ['economic_head'] },

    // Охрана труда - только охрана труда
    { text: 'Охрана труда', icon: <SafetyIcon />, path: '/safety', roles: ['safety_officer'] },

    // Отчеты - хоз. отдел и охрана труда
    { text: 'Отчеты', icon: <AssessmentIcon />, path: '/reports', roles: ['economic_head', 'safety_officer'] },

    // Администрирование - только админ
    { text: 'Администрирование', icon: <AdminIcon />, path: '/admin', roles: ['admin'] },

    // Выдача СИЗ - хоз. отдел и начальник цеха
    { text: 'Выдача СИЗ', icon: <InventoryIcon />, path: '/ppe-issues', roles: ['economic_head', 'department_head'] },

    // Массовая выдача - хоз. отдел и начальник цеха
    { text: 'Массовая выдача', icon: <GroupsIcon />, path: '/mass-issue', roles: ['economic_head', 'department_head'] },
  ];

  // Фильтруем пункты меню в зависимости от роли пользователя
  const visibleMenuItems = menuItems.filter(item => canSee(item.roles));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', py: 2 }}>
      <List>
        {visibleMenuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 2,
              mx: 1,
              mb: 0.5,
              cursor: 'pointer',
              backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
              justifyContent: drawerOpen && !isMobile ? 'initial' : 'center',
              px: drawerOpen && !isMobile ? 2 : 1,
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? '#1976d2' : '#666',
                minWidth: drawerOpen && !isMobile ? 40 : 'auto',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {(drawerOpen && !isMobile) && (
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? '#1976d2' : '#333',
                    fontSize: '0.9rem',
                  }
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Заменяем FactoryIcon на изображение логотипа */}
          <Avatar
  src={rtrsLogo}
  sx={{
    width: 60,
    height: 60,
    mr: 2,
    backgroundColor: 'transparent',
    '& img': {
      objectFit: 'contain',
    }
  }}
/>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.1rem' }}>
            ESM system
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Профиль">
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: '#dc004e', width: 32, height: 32, fontSize: '0.9rem' }}>
                  {(user.full_name || user.username || 'U')[0].toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Мой профиль
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/my-requests'); }}>
              <ReceiptIcon sx={{ mr: 1, fontSize: 20 }} /> Мои заявки
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20, color: '#dc004e' }} /> Выход
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
              boxSizing: 'border-box',
              mt: '64px',
              backgroundColor: '#f5f5f5',
              borderRight: '1px solid #e0e0e0',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              mt: '64px',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: '64px',
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          width: { xs: '100%', sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)` },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;