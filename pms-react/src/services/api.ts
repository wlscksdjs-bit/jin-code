import axios from 'axios';
import type { AuthTokens, User, BidSimulation, Project, ProjectVersion, CostCategory, Vendor, Budget, Expense } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh });
          localStorage.setItem('access_token', res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string): Promise<AuthTokens> => {
    const res = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return res.data;
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      await api.post('/auth/logout/', { refresh });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/accounts/users/me/');
    return res.data;
  },
};

export const projectApi = {
  getProjects: async () => {
    const res = await api.get('/projects/projects/');
    return res.data;
  },

  getProject: async (id: number) => {
    const res = await api.get(`/projects/projects/${id}/`);
    return res.data;
  },

  createProject: async (data: Partial<Project>) => {
    const res = await api.post('/projects/projects/', data);
    return res.data;
  },

  updateProject: async (id: number, data: Partial<Project>) => {
    const res = await api.patch(`/projects/projects/${id}/`, data);
    return res.data;
  },

  deleteProject: async (id: number) => {
    await api.delete(`/projects/projects/${id}/`);
  },

  createVersion: async (projectId: number, data: Partial<ProjectVersion>) => {
    const res = await api.post(`/projects/projects/${projectId}/create_version/`, data);
    return res.data;
  },

  simulateBid: async (data: { estimated_cost: string; target_profit_rate: string }): Promise<BidSimulation> => {
    const res = await api.post('/projects/projects/simulate_bid/', data);
    return res.data;
  },
};

export const costApi = {
  getCategories: async (): Promise<CostCategory[]> => {
    const res = await api.get('/cost/categories/');
    return res.data.results || res.data;
  },

  getVendors: async (): Promise<Vendor[]> => {
    const res = await api.get('/cost/vendors/');
    return res.data.results || res.data;
  },

  createVendor: async (data: Partial<Vendor>) => {
    const res = await api.post('/cost/vendors/', data);
    return res.data;
  },

  getBudgets: async (projectId: number): Promise<Budget[]> => {
    const res = await api.get(`/cost/budgets/?project=${projectId}`);
    return res.data.results || res.data;
  },

  createBudget: async (data: { project: number; category: number; planned_amount: string; description?: string }) => {
    const res = await api.post('/cost/budgets/', data);
    return res.data;
  },

  updateBudget: async (id: number, data: Partial<Budget>) => {
    const res = await api.patch(`/cost/budgets/${id}/`, data);
    return res.data;
  },

  deleteBudget: async (id: number) => {
    await api.delete(`/cost/budgets/${id}/`);
  },

  getExpenses: async (projectId: number): Promise<Expense[]> => {
    const res = await api.get(`/cost/expenses/?project=${projectId}`);
    return res.data.results || res.data;
  },

  createExpense: async (data: { budget: number; vendor?: number; amount: string; description: string; expense_date: string }) => {
    const res = await api.post('/cost/expenses/', data);
    return res.data;
  },

  approveExpense: async (id: number) => {
    const res = await api.post(`/cost/expenses/${id}/approve/`);
    return res.data;
  },

  rejectExpense: async (id: number) => {
    const res = await api.post(`/cost/expenses/${id}/reject/`);
    return res.data;
  },
};

export default api;