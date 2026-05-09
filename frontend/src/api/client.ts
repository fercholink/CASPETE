import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('caspete_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Flag para evitar bucles infinitos de refresco
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      config?: { _retry?: boolean; headers?: Record<string, string>; [key: string]: unknown };
      response?: { status?: number };
    };

    if (axiosError.response?.status !== 401 || axiosError.config?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('caspete_refresh_token');
    if (!refreshToken) {
      localStorage.removeItem('caspete_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    axiosError.config!._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          axiosError.config!.headers!['Authorization'] = `Bearer ${token}`;
          resolve(apiClient(axiosError.config!));
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post<{ success: true; data: { token: string; refresh_token: string } }>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
      );
      const { token, refresh_token: newRefreshToken } = res.data.data;
      localStorage.setItem('caspete_token', token);
      localStorage.setItem('caspete_refresh_token', newRefreshToken);
      onTokenRefreshed(token);
      axiosError.config!.headers!['Authorization'] = `Bearer ${token}`;
      return apiClient(axiosError.config!);
    } catch {
      localStorage.removeItem('caspete_token');
      localStorage.removeItem('caspete_refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
