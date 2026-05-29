import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Interceptor - token:', token ? token.substring(0, 20) + '...' : 'no token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  console.log('Request headers:', config.headers);
  return config;
});
// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Не возвращайте Promise.reject если не нужно
    return Promise.reject(error);
  }
);

// API для размеров
export const sizeApi = {
  getSizesByType: (type: string, gender?: string) =>
    api.get(`/admin/sizes/by-type-gender/`, { params: { size_type: type, gender } }),
  getClothingSizes: (gender?: string) =>
    api.get('/admin/sizes/by-type-gender/', { params: { size_type: 'clothing', gender } }),
  getFootwearSizes: () =>
    api.get('/admin/sizes/by-type-gender/', { params: { size_type: 'footwear' } }),
  getHeadwearSizes: () =>
    api.get('/admin/sizes/by-type-gender/', { params: { size_type: 'headwear' } }),
};
// API для охраны труда
export const safetyApi = {
  getStandards: () => api.get('/safety/standards/get_all_standards/'),
  createStandard: (data: any) => api.post('/safety/standards/create_standard/', data),
  updateStandard: (data: any) => api.put('/safety/standards/update_standard/', data),
  deleteStandard: (standardId: number) => api.delete('/safety/standards/delete_standard/', { data: { standard_id: standardId } }),
  getDueIssues: () => api.get('/safety/issues/get_due_issues/'),
  createIssue: (data: any) => api.post('/safety/issues/create_issue/', data),
};
// API для сотрудников
export const employeesApi = {
  getMyShopEmployees: () =>
    api.get('/employees/my_shop_employees/'),
  getEmployee: (id: number) =>
    api.get(`/employees/${id}/`),
  updateEmployee: (id: number, data: any) =>
    api.patch(`/employees/${id}/update_anthropometry/`),
  getAnthropometryHistory: (id: number) =>
    api.get(`/employees/${id}/history/`),
  getEmployeePPEHistory: (id: number) =>
    api.get(`/employees/ppe_history/?employee_id=${id}`), // Этот метод
};
// API для заявок
export const requestsApi = {
  getAll: () => api.get('/requests/'),
  getMy: () => api.get('/requests/my_requests/'),
  getPending: () => api.get('/requests/pending_requests/'),
  getAllForAdmin: () => api.get('/requests/all_requests_for_admin/'),
  getById: (id: number) => api.get(`/requests/${id}/`),
  create: (data: any) => api.post('/requests/', data),
  update: (id: number, data: any) => api.put(`/requests/${id}/update_request/`, data),
  cancel: (id: number, comment?: string) => api.post(`/requests/${id}/cancel_request/`, { comment }),
  approve: (id: number, comment?: string) => api.post(`/requests/${id}/approve/`, { comment }),
  reject: (id: number, comment?: string) => api.post(`/requests/${id}/reject/`, { comment }),
  makeOrder: (id: number, data: { supplier_name: string; order_price: number; comment?: string }) =>
    api.post(`/requests/${id}/make_order/`, data),
  complete: (id: number) => api.post(`/requests/${id}/complete/`),
  getHistory: (id: number) => api.get(`/requests/${id}/history/`),
};

// API для СИЗ
export const ppeApi = {
  getAvailableEmployees: () => api.get('/ppe/get_available_employees/'),
  getEmployeePPE: (employeeId: number) => api.get(`/ppe/get_employee_ppe/?employee_id=${employeeId}`),
  autoSelectSize: (employeeId: number, nomenclatureId: number) =>
    api.get(`/ppe/auto_select_size/?employee_id=${employeeId}&nomenclature_id=${nomenclatureId}`),
  createFullRequest: (data: any) => api.post('/full-requests/', data),
};
// API для отчетов
export const reportsApi = {
  getConsolidatedReport: () => api.get('/reports/generate_consolidated_report/', {
    responseType: 'blob',
  }),
};

// API для пользователей
export const usersApi = {
  getMe: () => api.get('/users/me/'),
  getByRole: (role: string) => api.get(`/users/by_role/?role=${role}`),

};

export default api;
