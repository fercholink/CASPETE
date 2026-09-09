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
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
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
      // Sin refresh token — simplemente rechazar. AuthContext + ProtectedRoute
      // se encargan de redirigir al login vía React Router.
      return Promise.reject(error);
    }

    axiosError.config!._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          if (axiosError.config!.headers) {
            axiosError.config!.headers['Authorization'] = `Bearer ${token}`;
          }
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
      localStorage.setItem('kidway_token', token);
      localStorage.setItem('kidway_refresh_token', newRefreshToken);
      onTokenRefreshed(token);
      if (axiosError.config!.headers) {
        axiosError.config!.headers['Authorization'] = `Bearer ${token}`;
      }
      return apiClient(axiosError.config!);
    } catch {
      // Refresh falló — limpiar tokens y rechazar.
      // AuthContext detectará user=null y ProtectedRoute redirigirá a /login.
      localStorage.removeItem('kidway_token');
      localStorage.removeItem('kidway_refresh_token');
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

