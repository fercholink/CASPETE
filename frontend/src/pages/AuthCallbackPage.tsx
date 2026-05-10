import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * /auth/callback
 * Google redirige aquí con ?token=JWT&refresh_token=REFRESH
 * Los guardamos en localStorage y redirigimos al dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuthFromTokens } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refresh_token');
    const err = params.get('error');

    if (err || !token || !refreshToken) {
      setError('Error al autenticar con Google. Intenta de nuevo.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Esperamos a que el usuario esté cargado antes de navegar
    setAuthFromTokens(token, refreshToken)
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError('No se pudo verificar la cuenta. Intenta de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [navigate, setAuthFromTokens]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: '#ef4444', fontWeight: 500 }}>{error}</p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
        <p style={{ color: '#1a4731', fontWeight: 600, fontSize: 16 }}>Autenticando con Google...</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Serás redirigido en un momento.</p>
      </div>
    </div>
  );
}
