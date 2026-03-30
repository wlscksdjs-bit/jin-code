import axios from 'axios';
import type { AuthTokens, User, BidSimulation, Project, ProjectVersion, CostCategory, Vendor, Budget, Expense, Approval, ApprovalType, ResourceAllocation, ResourceConflict, Task, GanttTask } from '../types';

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
    const res = await api.delete(`/projects/projects/${id}/`);
    return res.data;
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

export const approvalApi = {
  getApprovalTypes: async (): Promise<ApprovalType[]> => {
    const res = await api.get('/approvals/types/');
    return res.data.results || res.data;
  },

  getApprovals: async (): Promise<Approval[]> => {
    const res = await api.get('/approvals/');
    return res.data.results || res.data;
  },

  getApproval: async (id: number): Promise<Approval> => {
    const res = await api.get(`/approvals/${id}/`);
    return res.data;
  },

  createApproval: async (data: { project: number; approval_type: number; title: string; content: string; amount?: string; approvers: number[] }) => {
    const res = await api.post('/approvals/', data);
    return res.data;
  },

  submitApproval: async (id: number) => {
    const res = await api.post(`/approvals/${id}/submit/`);
    return res.data;
  },

  approveApproval: async (id: number, comment?: string) => {
    const res = await api.post(`/approvals/${id}/approve/`, { comment });
    return res.data;
  },

  rejectApproval: async (id: number, comment: string) => {
    const res = await api.post(`/approvals/${id}/reject/`, { comment });
    return res.data;
  },

  getPendingApprovals: async (): Promise<Approval[]> => {
    const res = await api.get('/approvals/pending/');
    return res.data;
  },
};

export const resourceApi = {
  getAllocations: async (projectId?: number, userId?: number): Promise<ResourceAllocation[]> => {
    let url = '/resources/';
    const params = new URLSearchParams();
    if (projectId) params.append('project', String(projectId));
    if (userId) params.append('user', String(userId));
    if (params.toString()) url += '?' + params.toString();
    const res = await api.get(url);
    return res.data.results || res.data;
  },

  createAllocation: async (data: { project: number; user?: number; vendor?: number; role: string; start_date: string; end_date: string; allocation_rate: number; description?: string }) => {
    const res = await api.post('/resources/', data);
    return res.data;
  },

  updateAllocation: async (id: number, data: Partial<ResourceAllocation>) => {
    const res = await api.patch(`/resources/${id}/`, data);
    return res.data;
  },

  deleteAllocation: async (id: number) => {
    await api.delete(`/resources/${id}/`);
  },

  getConflicts: async (): Promise<ResourceConflict[]> => {
    const res = await api.get('/resources/conflicts/');
    return res.data;
  },

  checkConflicts: async (userId: number, startDate: string, endDate: string, allocationRate: number) => {
    const res = await api.get(`/resources/check_conflicts/?user_id=${userId}&start_date=${startDate}&end_date=${endDate}&allocation_rate=${allocationRate}`);
    return res.data;
  },

  getHeatmap: async (year: number, month: number): Promise<{ id: number; name: string; type: 'internal' | 'external'; total_rate: number; projects: { project_name: string; rate: number }[] }[]> => {
    const res = await api.get(`/resources/heatmap/?year=${year}&month=${month}`);
    return res.data;
  },
};

export const scheduleApi = {
  getTasks: async (projectId: number): Promise<Task[]> => {
    const res = await api.get(`/schedule/tasks/?project=${projectId}`);
    return res.data.results || res.data;
  },

  createTask: async (data: { project: number; parent?: number; name: string; description?: string; start_date: string; end_date: string; assignee?: number; order?: number; is_milestone?: boolean }) => {
    const res = await api.post('/schedule/tasks/', data);
    return res.data;
  },

  updateTask: async (id: number, data: Partial<Task>) => {
    const res = await api.patch(`/schedule/tasks/${id}/`, data);
    return res.data;
  },

  deleteTask: async (id: number) => {
    await api.delete(`/schedule/tasks/${id}/`);
  },

  updateProgress: async (id: number, progress: number) => {
    const res = await api.post(`/schedule/tasks/${id}/update_progress/`, { progress });
    return res.data;
  },

  getGanttData: async (projectId: number): Promise<GanttTask[]> => {
    const res = await api.get(`/schedule/tasks/gantt/?project=${projectId}`);
    return res.data;
  },

  getDelayedTasks: async (): Promise<Task[]> => {
    const res = await api.get('/schedule/tasks/delayed/');
    return res.data;
  },
};

export const excelApi = {
  importProjects: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/projects/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  exportProjects: async () => {
    const res = await api.get('/projects/export/', { responseType: 'blob' });
    return res.data;
  },

  importResources: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/resources/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  exportResources: async () => {
    const res = await api.get('/resources/export/', { responseType: 'blob' });
    return res.data;
  },

  importApprovals: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/approvals/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  exportApprovals: async () => {
    const res = await api.get('/approvals/export/', { responseType: 'blob' });
    return res.data;
  },
};

export default api;