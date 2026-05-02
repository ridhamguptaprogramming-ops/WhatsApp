import axios, { AxiosError } from 'axios';
import type { IUser, IAuthResponse, ILoginCredentials, IRegisterData } from '../types';

const API_URL = '/api/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Register
export const register = async (data: IRegisterData): Promise<IAuthResponse> => {
  const response = await api.post<IAuthResponse>('/register', data);
  const { accessToken, refreshToken, user } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  return { accessToken, refreshToken, user };
};

// Login
export const login = async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
  const response = await api.post<IAuthResponse>('/login', credentials);
  const { accessToken, refreshToken, user } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  return { accessToken, refreshToken, user };
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/logout');
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Get current user
export const getCurrentUser = async (): Promise<IUser> => {
  const response = await api.get<IUser>('/me');
  return response.data;
};

// Refresh token
export const refreshAccessToken = async (
  refreshToken: string
): Promise<IAuthResponse> => {
  const response = await api.post('/refresh', { refreshToken });
  const { accessToken, refreshToken: newRefreshToken, user } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
  return { accessToken, refreshToken: newRefreshToken, user };
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

export default api;
