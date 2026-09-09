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

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('kidway_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function decodeJwtUser(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(json) as {
      sub?: string;
      email?: string;
      role?: AuthUser['role'];
      schoolId?: string | null;
    };
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: payload.sub,
      email: payload.email,
      full_name: payload.email.split('@')[0],
      role: payload.role,
      school_id: payload.schoolId ?? null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('kidway_token');
    const storedUser = getStoredUser();
    const user = storedUser || (token ? decodeJwtUser(token) : null);

    if (token && user) {
      if (!storedUser) {
        localStorage.setItem('kidway_user', JSON.stringify(user));
      }
      return { user, token, isLoading: false };
    }

    return {
      user: null,
      token,
      isLoading: Boolean(token),
    };
  });

  useEffect(() => {
    const token = localStorage.getItem('kidway_token');

    // Si no hay token en localStorage, intentar verificar cookie OAuth (ej. Google)
    if (!token) {
      apiClient
        .get<{ success: true; data: AuthUser }>('/auth/me')
        .then((res) => {
          localStorage.setItem('kidway_user', JSON.stringify(res.data.data));
          setState({ user: res.data.data, token: null, isLoading: false });
        })
        .catch(() => {
          setState({ user: null, token: null, isLoading: false });
        });
      return;
    }

    // Si hay token, consultar /auth/me en segundo plano para sincronizar datos frescos
    apiClient
      .get<{ success: true; data: AuthUser }>('/auth/me')
      .then((res) => {
        const currentToken = localStorage.getItem('kidway_token') ?? token;
        localStorage.setItem('kidway_user', JSON.stringify(res.data.data));
        setState({ user: res.data.data, token: currentToken, isLoading: false });
      })
      .catch(() => {
        // En caso de cualquier error (red, 401 temporal, 500, o CORS),
        // NUNCA desloguear al usuario en la recarga: conservar la sesión activa.
        setState((prev) => ({ ...prev, isLoading: false }));
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

