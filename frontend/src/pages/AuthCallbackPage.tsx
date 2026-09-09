import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * /auth/callback
 *
 * FIX A-01: Ya NO lee ?token= ni ?refresh_token= de la URL.
 * El backend coloca los tokens en cookies HttpOnly+Secure al redirigir aquí.
 * Esta página llama a GET /api/auth/me para cargar el usuario;
 * la cookie access_token viaja automáticamente (withCredentials: true).
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginFromCookie } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si el backend reportó un error (ej: ?error=google_failed)
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');

    if (err) {
      setError('Error al autenticar con Google. Intenta de nuevo.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Cargar el usuario usando la cookie HttpOnly que el backend ya colocó
    loginFromCookie()
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError('No se pudo verificar la cuenta. Intenta de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [navigate, loginFromCookie]);

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
