import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/update-me', data),
  updatePassword: (data) => api.patch('/auth/update-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.patch(`/auth/reset-password/${token}`, data),
};

export const agentAPI = {
  getAll: () => api.get('/agents'),
  getOne: (id) => api.get(`/agents/${id}`),
  invite: (data) => api.post('/agents/invite', data),
  update: (id, data) => api.patch(`/agents/${id}`, data),
  suspend: (id) => api.patch(`/agents/${id}/suspend`),
  activate: (id) => api.patch(`/agents/${id}/activate`),
  remove: (id) => api.delete(`/agents/${id}`),
};

export const chatAPI = {
  getAll: (params) => api.get('/chats', { params }),
  getOne: (id) => api.get(`/chats/${id}`),
  assign: (id, agentId) => api.patch(`/chats/${id}/assign`, { agentId }),
  close: (id) => api.patch(`/chats/${id}/close`),
  reopen: (id) => api.patch(`/chats/${id}/reopen`),
  transfer: (id, agentId) => api.patch(`/chats/${id}/transfer`, { agentId }),
  addNote: (id, content) => api.post(`/chats/${id}/notes`, { content }),
};

export const messageAPI = {
  getAll: (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  send: (conversationId, data) => {
    if (data instanceof FormData) {
      return api.post(`/messages/${conversationId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post(`/messages/${conversationId}`, data);
  },
  markRead: (conversationId) => api.patch(`/messages/${conversationId}/read`),
};

export const ticketAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getOne: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.patch(`/tickets/${id}`, data),
  reply: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/tickets/${id}/reply`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post(`/tickets/${id}/reply`, data);
  },
  delete: (id) => api.delete(`/tickets/${id}`),
};

export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getChatStats: (params) => api.get('/analytics/chats', { params }),
  getAgentPerformance: (params) => api.get('/analytics/agents', { params }),
  getVisitorStats: (params) => api.get('/analytics/visitors', { params }),
};

export const articleAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getOne: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.patch(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
};

export const visitorAPI = {
  getAll: (params) => api.get('/visitors', { params }),
  getOne: (id) => api.get(`/visitors/${id}`),
  addNote: (id, content) => api.post(`/visitors/${id}/notes`, { content }),
  ban: (id) => api.patch(`/visitors/${id}/ban`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  updateCompany: (data) => {
    if (data instanceof FormData) {
      return api.patch('/settings/company', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.patch('/settings/company', data);
  },
  updateWidget: (data) => {
    if (data instanceof FormData) {
      return api.patch('/settings/widget', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.patch('/settings/widget', data);
  },
  getWidgetScript: () => api.get('/settings/widget-script'),
};


// Portal API — uses its own axios instance with portal token
const portalApi = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (res) => res.data,
  (error) => Promise.reject(error.response?.data || { message: error.message })
);

export const portalAPI = {
  getInfo: (companyId) => portalApi.get(`/portal/${companyId}/info`),
  checkEmail: (companyId, email) => portalApi.post(`/portal/${companyId}/auth/check`, { email }),
  register: (companyId, data) => portalApi.post(`/portal/${companyId}/auth/register`, data),
  login: (companyId, data) => portalApi.post(`/portal/${companyId}/auth/login`, data),
  forgotPassword: (companyId, email) => portalApi.post(`/portal/${companyId}/auth/forgot-password`, { email }),
  getTickets: (companyId) => portalApi.get(`/portal/${companyId}/tickets`),
  createTicket: (companyId, data) => portalApi.post(`/portal/${companyId}/tickets`, data),
  getTicket: (companyId, ticketId) => portalApi.get(`/portal/${companyId}/tickets/${ticketId}`),
  reply: (companyId, ticketId, content) => portalApi.post(`/portal/${companyId}/tickets/${ticketId}/reply`, { content }),
};

export default api;
