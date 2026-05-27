import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EconomicDashboard from './components/EconomicDashboard';
import RequestDetail from './components/RequestDetail';
import Profile from './components/Profile';
import MyRequests from './components/MyRequests';
import Reports from './components/Reports';
import AdminPanel from './components/AdminPanel';
import EmployeeManagement from './components/EmployeeManagement';
import SafetyDashboard from './components/SafetyDashboard';
import PPEIssues from './components/PPEIssues';
import MassIssue from './components/MassIssue';
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.is_superuser === true;

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/economic"
            element={
              <ProtectedRoute>
                <EconomicDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safety"
            element={
              <ProtectedRoute>
                <SafetyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request/:id"
            element={
              <ProtectedRoute>
                <RequestDetail />
              </ProtectedRoute>
            }
          />
          {isAdmin && (
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          )}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/ppe-issues" element={<PPEIssues />} />
          <Route path="/mass-issue" element={<MassIssue />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;