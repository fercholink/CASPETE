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

  // Hay token guardado pero no se pudo verificar (backend no disponible).
  // No redirigir al login — mostrar aviso de error de red.
  if (!user && token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: 24 }}>
        <span style={{ fontSize: 40 }}>📡</span>
        <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>No se pudo conectar con el servidor</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          Tu sesión sigue activa. Recarga la página cuando el servidor esté disponible.
        </p>
        <button
          className="btn-primary"
          style={{ marginTop: 8 }}
          onClick={() => window.location.reload()}
        >
          🔄 Recargar
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
