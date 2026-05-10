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
  const { user, isLoading } = useAuth();

  // Registrar notificaciones push para padres
  usePushNotification();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <>{children}</>;
}
