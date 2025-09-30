import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('auth_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface Student {
  id: number;
  name: string;
  roll_number: string;
  class_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Subject {
  id?: number;
  name: string;
  max_marks: number;
}

export interface Test {
  id: number;
  name: string;
  date: string;
  subjects: Subject[];
  student_count?: number;
}

export interface Mark {
  id: number;
  student_id: number;
  test_id: number;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
  student?: Student;
  test?: Test;
}

export interface Topper {
  student: Student;
  total_marks: number;
  percentage: number;
  subject?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// API Functions

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register/', {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/user/');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout/');
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await api.post('/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Student API
export const studentApi = {
  getAll: async (params?: { page?: number; search?: string; class?: string }): Promise<Student[]> => {
    const response = await api.get('/students/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Student> => {
    const response = await api.get(`/students/${id}/`);
    return response.data;
  },

  create: async (student: Omit<Student, 'id' | 'created_at'>): Promise<Student> => {
    const response = await api.post('/students/', student);
    return response.data;
  },

  update: async (id: number, student: Partial<Student>): Promise<Student> => {
    const response = await api.put(`/students/${id}/`, student);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },
};

// Test API
export const testApi = {
  getAll: async (params?: { page?: number; search?: string }): Promise<Test[]> => {
    const response = await api.get('/tests/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Test> => {
    const response = await api.get(`/tests/${id}/`);
    return response.data;
  },

  create: async (test: Omit<Test, 'id' | 'student_count'>): Promise<Test> => {
    const response = await api.post('/tests/', test);
    return response.data;
  },

  update: async (id: number, test: Partial<Test>): Promise<Test> => {
    const response = await api.put(`/tests/${id}/`, test);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tests/${id}/`);
  },
};

// Mark API
export const markApi = {
  getAll: async (params?: { student_id?: number; test_id?: number; page?: number }): Promise<Mark[]> => {
    const response = await api.get('/marks/', { params });
    return response.data.results || response.data;
  },

  create: async (mark: Omit<Mark, 'id'>): Promise<Mark> => {
    const response = await api.post('/marks/', mark);
    return response.data;
  },

  update: async (id: number, mark: Partial<Mark>): Promise<Mark> => {
    const response = await api.put(`/marks/${id}/`, mark);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/marks/${id}/`);
  },
};

// Report API
export const reportApi = {
  getTestToppers: async (testId: number): Promise<Topper[]> => {
    const response = await api.get(`/reports/test_topper/?test_id=${testId}`);
    return response.data;
  },

  getGlobalTopPerformers: async (params?: { class?: string; limit?: number }): Promise<Topper[]> => {
    const response = await api.get('/reports/global_top_performers/', { params });
    return response.data;
  },
};

export default api;
