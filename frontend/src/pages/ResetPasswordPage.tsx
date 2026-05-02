import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (!token) { setError('El enlace de recuperación es inválido. Solicita uno nuevo.'); return; }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'El enlace es inválido o ya expiró. Solicita uno nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#111827', marginBottom: 8 }}>Enlace inválido</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>Este enlace de recuperación no es válido. Solicita uno nuevo.</p>
          <Link to="/forgot-password" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, marginBottom: 20, textDecoration: 'none', fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al login
        </Link>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', lineHeight: 1 }}>CASPETE</div>
            <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loncheras Escolares Inteligentes</div>
          </div>
        </div>

        {!success ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(26,71,49,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Nueva contraseña</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>Elige una contraseña segura para tu cuenta.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Nueva contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" className="form-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres" autoComplete="new-password" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirmar contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input id="confirmPassword" className="form-input" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repite tu contraseña" autoComplete="new-password" style={{ paddingRight: 44, borderColor: !passwordsMatch ? '#ef4444' : undefined }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {!passwordsMatch && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠ Las contraseñas no coinciden</p>}
                {passwordsMatch && confirmPassword.length > 0 && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>✓ Las contraseñas coinciden</p>}
              </div>

              {error && (
                <div style={{ marginBottom: 12 }}>
                  <p className="form-error">{error}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
                    <Link to="/forgot-password" style={{ color: '#1a4731', fontWeight: 600 }}>Solicitar nuevo enlace</Link>
                  </p>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || !passwordsMatch}>
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>¡Contraseña actualizada!</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Tu contraseña se cambió exitosamente. Serás redirigido al login en 3 segundos...</p>
            <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>Ir al inicio de sesión →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
