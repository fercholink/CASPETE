import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

type VerifyState = 'verifying' | 'success' | 'error' | 'resend-success';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('El enlace de verificación no contiene un token válido.');
      return;
    }

    async function verify() {
      try {
        await apiClient.post('/auth/verify-email', { token });
        setState('success');
      } catch (err: unknown) {
        setState('error');
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? 'No se pudo verificar el correo electrónico. El enlace puede haber expirado o ser inválido.';
        setErrorMsg(msg);
      }
    }

    verify();
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setResendError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setResendLoading(true);
    setResendError('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setState('resend-success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? 'Error al reenviar el enlace de verificación.';
      setResendError(msg);
    } finally {
      setResendLoading(false);
    }
  }

  const backArrow = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        {state !== 'verifying' && (
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20, textDecoration: 'none', fontWeight: 500 }}>
            {backArrow} Volver al login
          </Link>
        )}

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, marginBottom: 24 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', marginTop: 4 }}>CASPETE</span>
          <span style={{ fontSize: 8, fontWeight: 500, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loncheras Escolares Inteligentes</span>
        </div>

        {/* 1. STATE: VERIFYING */}
        {state === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '4px solid rgba(26, 71, 49, 0.1)',
                borderTopColor: '#1a4731',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Verificando correo electrónico</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15, margin: 0 }}>
              Por favor espera un momento mientras validamos tu token de confirmación...
            </p>
            {/* Declaración clave de animación inline en caso de no estar en la hoja de estilos */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* 2. STATE: SUCCESS */}
        {state === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>¡Cuenta confirmada!</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Tu correo electrónico ha sido verificado con éxito. Ya puedes acceder a todas las funcionalidades de tu panel de Caspete.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* 3. STATE: ERROR */}
        {state === 'error' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8, textAlign: 'center' }}>Enlace inválido o vencido</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
              {errorMsg}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginTop: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px' }}>¿Necesitas un nuevo enlace?</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.5, margin: '0 0 12px' }}>
                Ingresa el correo electrónico asociado a tu cuenta para recibir un nuevo enlace de verificación válido por 24 horas.
              </p>

              <form onSubmit={handleResend}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" htmlFor="resend-email" style={{ fontSize: 12 }}>Correo electrónico</label>
                  <input
                    id="resend-email"
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    style={{ fontSize: 13, padding: '8px 12px' }}
                  />
                </div>
                {resendError && <p className="form-error" style={{ fontSize: 12, marginBottom: 10 }}>{resendError}</p>}
                <button type="submit" className="btn-primary" disabled={resendLoading} style={{ padding: '8px 16px', fontSize: 13 }}>
                  {resendLoading ? 'Enviando...' : 'Reenviar enlace de confirmación'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. STATE: RESEND SUCCESS */}
        {state === 'resend-success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>¡Enlace enviado!</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Si el correo <strong>{email}</strong> corresponde a una cuenta registrada y pendiente por confirmar, recibirás un nuevo enlace de verificación en los próximos minutos.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>
              No olvides revisar la carpeta de correo no deseado (spam) si no lo encuentras en tu bandeja de entrada.
            </p>
            <button type="button" onClick={() => setState('error')} style={{ width: '100%', background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, color: 'var(--color-text)' }}>
              Intentar con otro correo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
