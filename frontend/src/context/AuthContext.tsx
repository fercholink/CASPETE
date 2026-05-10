import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'PARENT' | 'VENDOR' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
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
  setAuthFromTokens: (token: string, refreshToken: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('caspete_token'),
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('caspete_token');
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    apiClient
      .get<{ success: true; data: AuthUser }>('/auth/me')
      .then((res) => {
        setState({ user: res.data.data, token, isLoading: false });
      })
      .catch(() => {
        // El interceptor de apiClient ya intenta el refresh automáticamente.
        // Si llega aquí es porque el refresh también falló.
        localStorage.removeItem('caspete_token');
        localStorage.removeItem('caspete_refresh_token');
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{
      success: true;
      data: { user: AuthUser; token: string; refresh_token: string };
    }>('/auth/login', { email, password });
    const { user, token, refresh_token } = res.data.data;
    localStorage.setItem('caspete_token', token);
    localStorage.setItem('caspete_refresh_token', refresh_token);
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('caspete_refresh_token');
    if (refreshToken) {
      // Revocar en el servidor (best-effort)
      apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined);
    }
    localStorage.removeItem('caspete_token');
    localStorage.removeItem('caspete_refresh_token');
    setState({ user: null, token: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setState((prev) => prev.user ? { ...prev, user: { ...prev.user, ...partial } } : prev);
  }, []);

  // Usado por el callback de Google OAuth para guardar tokens y cargar el usuario
  const setAuthFromTokens = useCallback(async (token: string, refreshToken: string): Promise<void> => {
    localStorage.setItem('caspete_token', token);
    localStorage.setItem('caspete_refresh_token', refreshToken);
    try {
      const res = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
      setState({ user: res.data.data, token, isLoading: false });
    } catch {
      localStorage.removeItem('caspete_token');
      localStorage.removeItem('caspete_refresh_token');
      setState({ user: null, token: null, isLoading: false });
      throw new Error('No se pudo cargar el usuario');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, setAuthFromTokens }}>
      {children}
    </AuthContext.Provider>
  );
}
