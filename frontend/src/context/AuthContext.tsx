import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'PARENT' | 'VENDOR' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';
  school_id: string | null;
  school?: { id: string; name: string; city: string } | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  /**
   * FIX A-01: Reemplaza setAuthFromTokens.
   * Carga el usuario llamando a GET /api/auth/me.
   * La cookie HttpOnly access_token (puesta por el backend en el callback OAuth)
   * viaja automáticamente — no se necesita pasar ni guardar ningún token.
   */
  loginFromCookie: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001/api';

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('kidway_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    // Margen de 15 segundos antes de expiración real
    return Date.now() >= (payload.exp * 1000) - 15000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('kidway_token');
    const user = getStoredUser();

    // Si ya tenemos token y usuario almacenados:
    // El usuario puede acceder INMEDIATAMENTE sin parpadeos ni "Cargando..."
    if (token && user) {
      return { user, token, isLoading: false };
    }

    // Si hay token pero aún no tenemos usuario, o no hay nada:
    return {
      user: null,
      token,
      isLoading: Boolean(token),
    };
  });

  useEffect(() => {
    const token = localStorage.getItem('kidway_token');
    const refreshToken = localStorage.getItem('kidway_refresh_token');

    // Caso 1: No hay token guardado
    if (!token) {
      // Podría haber sesión activa por cookie (ej. Google OAuth)
      apiClient
        .get<{ success: true; data: AuthUser }>('/auth/me')
        .then((res) => {
          localStorage.setItem('kidway_user', JSON.stringify(res.data.data));
          setState({ user: res.data.data, token: null, isLoading: false });
        })
        .catch(() => {
          localStorage.removeItem('kidway_user');
          setState({ user: null, token: null, isLoading: false });
        });
      return;
    }

    // Caso 2: El access token existe pero ya expiró según su timestamp
    if (isTokenExpired(token)) {
      if (refreshToken) {
        axios
          .post<{ success: true; data: { token: string; refresh_token: string } }>(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
          )
          .then(async (refreshRes) => {
            const { token: newToken, refresh_token: newRefreshToken } = refreshRes.data.data;
            localStorage.setItem('kidway_token', newToken);
            localStorage.setItem('kidway_refresh_token', newRefreshToken);

            try {
              const meRes = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
              localStorage.setItem('kidway_user', JSON.stringify(meRes.data.data));
              setState({ user: meRes.data.data, token: newToken, isLoading: false });
            } catch {
              const existingUser = getStoredUser();
              setState({ user: existingUser, token: newToken, isLoading: false });
            }
          })
          .catch((refreshErr: unknown) => {
            const status = (refreshErr as { response?: { status?: number } })?.response?.status;
            if (status === 401) {
              // Servidor rechazó explícitamente el refresh token: sesión expirada
              localStorage.removeItem('kidway_token');
              localStorage.removeItem('kidway_refresh_token');
              localStorage.removeItem('kidway_user');
              setState({ user: null, token: null, isLoading: false });
            } else {
              // Error de red / backend temporal: CONSERVAR sesión
              const existingUser = getStoredUser();
              setState({ user: existingUser, token, isLoading: false });
            }
          });
        return;
      }
    }

    // Caso 3: Token vigente o verificación en segundo plano
    apiClient
      .get<{ success: true; data: AuthUser }>('/auth/me')
      .then((res) => {
        const currentToken = localStorage.getItem('kidway_token') ?? token;
        localStorage.setItem('kidway_user', JSON.stringify(res.data.data));
        setState({ user: res.data.data, token: currentToken, isLoading: false });
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          // El interceptor de apiClient ya intentó refrescar.
          // Solo si los tokens ya fueron borrados por 401 definitivo, limpiar estado.
          const currentToken = localStorage.getItem('kidway_token');
          if (!currentToken) {
            localStorage.removeItem('kidway_user');
            setState({ user: null, token: null, isLoading: false });
          }
        } else {
          // Error de red, 500 o backend no disponible:
          // CONSERVAR el usuario guardado para no desloguear
          const existingUser = getStoredUser();
          setState({ user: existingUser, token, isLoading: false });
        }
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{
      success: true;
      data: { user: AuthUser; token: string; refresh_token: string };
    }>('/auth/login', { email, password });
    const { user, token, refresh_token } = res.data.data;
    localStorage.setItem('kidway_token', token);
    localStorage.setItem('kidway_refresh_token', refresh_token);
    localStorage.setItem('kidway_user', JSON.stringify(user));
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('kidway_refresh_token');
    if (refreshToken) {
      apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined);
    }
    localStorage.removeItem('kidway_token');
    localStorage.removeItem('kidway_refresh_token');
    localStorage.removeItem('kidway_user');
    setState({ user: null, token: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...partial };
      localStorage.setItem('kidway_user', JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }, []);

  const loginFromCookie = useCallback(async (): Promise<void> => {
    const res = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
    localStorage.setItem('kidway_user', JSON.stringify(res.data.data));
    setState({ user: res.data.data, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, loginFromCookie }}>
      {children}
    </AuthContext.Provider>
  );
}

