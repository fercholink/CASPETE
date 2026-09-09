import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('kidway_token'),
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('kidway_token');
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
        localStorage.removeItem('kidway_token');
        localStorage.removeItem('kidway_refresh_token');
        setState({ user: null, token: null, isLoading: false });
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
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('kidway_refresh_token');
    if (refreshToken) {
      // Revocar en el servidor (best-effort)
      apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined);
    }
    localStorage.removeItem('kidway_token');
    localStorage.removeItem('kidway_refresh_token');
    setState({ user: null, token: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setState((prev) => prev.user ? { ...prev, user: { ...prev.user, ...partial } } : prev);
  }, []);

  /**
   * FIX A-01: Reemplaza setAuthFromTokens(token, refreshToken).
   * Llama a GET /api/auth/me — la cookie HttpOnly access_token se envía
   * automáticamente gracias a withCredentials: true en el apiClient.
   * No se guarda ningún token en localStorage desde el flujo OAuth.
   */
  const loginFromCookie = useCallback(async (): Promise<void> => {
    const res = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
    // El token de la cookie no lo gestionamos desde JS (es HttpOnly).
    // Lo que sí guardamos es el token que devuelva el interceptor de refresco
    // si hubiera que refrescar — pero para el login inicial con cookie, no hay token
    // en localStorage todavía, así que lo marcamos como null y confiamos en la cookie.
    setState({ user: res.data.data, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, loginFromCookie }}>
      {children}
    </AuthContext.Provider>
  );
}
