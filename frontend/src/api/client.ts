import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true — necesario para que las cookies HttpOnly del flujo OAuth
  // (access_token, refresh_token) se envíen automáticamente al backend.
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kidway_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Flag para evitar bucles infinitos de refresco
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((sub) => sub.reject(err));
  refreshSubscribers = [];
}

// Endpoints públicos de auth: un 401 aquí es una respuesta de negocio normal
// (credenciales inválidas, correo no verificado) — no una sesión expirada.
// No debe disparar el refresh ni la redirección a /login.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      config?: { _retry?: boolean; headers?: Record<string, string>; url?: string; [key: string]: unknown };
      response?: { status?: number };
    };

    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => axiosError.config?.url?.includes(path));

    if (axiosError.response?.status !== 401 || axiosError.config?._retry || isPublicAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('kidway_refresh_token');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    axiosError.config!._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: (token) => {
            if (axiosError.config!.headers) {
              axiosError.config!.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(apiClient(axiosError.config!));
          },
          reject: (err) => reject(err),
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
      localStorage.setItem('kidway_token', token);
      localStorage.setItem('kidway_refresh_token', newRefreshToken);
      onTokenRefreshed(token);
      if (axiosError.config!.headers) {
        axiosError.config!.headers['Authorization'] = `Bearer ${token}`;
      }
      return apiClient(axiosError.config!);
    } catch (refreshErr: unknown) {
      onRefreshFailed(refreshErr);
      const status = (refreshErr as { response?: { status?: number } })?.response?.status;
      // Solo limpiar tokens si el servidor rechazó explícitamente el refresh con 401.
      // Si es error de red o backend temporalmente caído, preservar tokens.
      if (status === 401) {
        localStorage.removeItem('kidway_token');
        localStorage.removeItem('kidway_refresh_token');
        localStorage.removeItem('kidway_user');
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

