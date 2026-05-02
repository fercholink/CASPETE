import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import type { AuthUser } from '../context/AuthContext';

const ROLE_OPTIONS: { value: AuthUser['role']; label: string; description: string }[] = [
  { value: 'PARENT', label: '👨 Padre de familia', description: 'Programo la lonchera de mi hijo/a' },
  { value: 'PARENT', label: '👩 Madre de familia', description: 'Programo la lonchera de mi hijo/a' },
  { value: 'PARENT', label: '👴 Acudiente', description: 'Soy el responsable del estudiante' },
  { value: 'PARENT', label: '👪 Familiar', description: 'Familiar a cargo del estudiante' },
  { value: 'VENDOR', label: '🏪 Tendero', description: 'Administro una tienda escolar' },
  { value: 'SCHOOL_ADMIN', label: '🏫 Administrador de colegio', description: 'Gestiono mi institución educativa' },
];

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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '', roleIndex: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'email') setEmailExists(false);
  }

  const passwordsMatch = form.confirmPassword === '' || form.password === form.confirmPassword;
  const selectedRole = ROLE_OPTIONS[form.roleIndex];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true); setError(''); setEmailExists(false);
    try {
      await apiClient.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        role: selectedRole.value,
        ...(form.phone ? { phone: form.phone } : {}),
      });
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al registrarse';
      setError(msg);
      if (msg.toLowerCase().includes('ya está registrado') || msg.toLowerCase().includes('ya existe')) setEmailExists(true);
    } finally { setLoading(false); }
  }

  const backArrow = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const logo = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, marginBottom: 24 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{ fontSize: 20, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', marginTop: 4 }}>CASPETE</span>
      <span style={{ fontSize: 8, fontWeight: 500, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loncheras Escolares Inteligentes</span>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20, textDecoration: 'none', fontWeight: 500 }}>
          {backArrow} Volver al inicio
        </Link>
        {logo}
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Empieza a gestionar loncheras escolares</p>

        <form onSubmit={handleSubmit}>
          {/* Nombre y Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">Nombre(s)</label>
              <input id="firstName" name="firstName" className="form-input" type="text" value={form.firstName} onChange={handleChange} required placeholder="Juan" autoComplete="given-name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Apellido(s)</label>
              <input id="lastName" name="lastName" className="form-input" type="text" value={form.lastName} onChange={handleChange} required placeholder="García" autoComplete="family-name" />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" className="form-input" type="email" value={form.email} onChange={handleChange} required placeholder="tu@correo.com" autoComplete="email" />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input id="password" name="password" className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required minLength={8} placeholder="Mínimo 8 caracteres" autoComplete="new-password" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex' }} aria-label="Mostrar/ocultar contraseña">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input id="confirmPassword" name="confirmPassword" className="form-input" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} required placeholder="Repite tu contraseña" autoComplete="new-password" style={{ paddingRight: 44, borderColor: !passwordsMatch ? '#ef4444' : undefined }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex' }} aria-label="Mostrar/ocultar contraseña">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {!passwordsMatch && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠ Las contraseñas no coinciden</p>}
            {passwordsMatch && form.confirmPassword.length > 0 && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>✓ Las contraseñas coinciden</p>}
          </div>

          {/* Teléfono */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Teléfono <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span></label>
            <input id="phone" name="phone" className="form-input" type="tel" value={form.phone} onChange={handleChange} placeholder="+573001234567" autoComplete="tel" />
          </div>

          {/* Tipo de usuario — tarjetas */}
          <div className="form-group">
            <label className="form-label">Tipo de usuario</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {ROLE_OPTIONS.map((opt, idx) => (
                <button key={idx} type="button" onClick={() => setForm(p => ({ ...p, roleIndex: idx }))}
                  style={{ border: `2px solid ${form.roleIndex === idx ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 10, padding: '10px 12px', background: form.roleIndex === idx ? 'rgba(26,71,49,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.roleIndex === idx ? 'var(--color-primary)' : 'var(--color-text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div>
              <p className="form-error">{error}</p>
              {emailExists && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6, textAlign: 'center' }}>
                  ¿Olvidaste tu contraseña?{' '}
                  <Link to={`/forgot-password?email=${encodeURIComponent(form.email)}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Recupérala aquí</Link>{' '}o{' '}
                  <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Inicia sesión</Link>
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !passwordsMatch}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">¿Ya tienes cuenta?{' '}<Link to="/login">Iniciar sesión</Link></p>
      </div>
    </div>
  );
}
