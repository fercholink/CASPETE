import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AuthUser } from '../context/AuthContext';
import { usePushNotification } from '../hooks/usePushNotification';

interface Props {
  children: ReactNode;
  allowedRoles?: AuthUser['role'][];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, token, isLoading } = useAuth();

  // Registrar notificaciones push para padres
  usePushNotification();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        Cargando...
      </div>
    );
  }

  // Verificar si hay algún indicio de sesión en el almacenamiento local
  const hasLocalSession = Boolean(
    token ||
    localStorage.getItem('kidway_user') ||
    localStorage.getItem('kidway_token') ||
    localStorage.getItem('kidway_refresh_token')
  );

  // Hay sesión guardada pero user aún es null (ej. llamada de red pendiente o error transitorio).
  // No redirigir al login — mostrar aviso de conexión para no perder la ruta ni la sesión.
  if (!user && hasLocalSession) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: 24 }}>
        <span style={{ fontSize: 40 }}>📡</span>
        <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>Conectando con el servidor...</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          Tu sesión está guardada. Haz clic en reintentar para continuar.
        </p>
        <button
          className="btn-primary"
          style={{ marginTop: 8 }}
          onClick={() => window.location.reload()}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <>{children}</>;
}
