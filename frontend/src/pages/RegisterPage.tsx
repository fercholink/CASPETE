import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import type { AuthUser } from '../context/AuthContext';

const ROLE_OPTIONS: { value: AuthUser['role']; label: string; description: string; icon: string }[] = [
  { value: 'PARENT', label: 'Padre de familia', description: 'Programo la lonchera de mi hijo/a', icon: '👨' },
  { value: 'PARENT', label: 'Madre de familia', description: 'Programo la lonchera de mi hijo/a', icon: '👩' },
  { value: 'PARENT', label: 'Acudiente', description: 'Soy el responsable del estudiante', icon: '👴' },
  { value: 'PARENT', label: 'Familiar', description: 'Familiar a cargo del estudiante', icon: '👪' },
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
        ...(form.phone ? { phone: form.phone.replace(/\s/g, '') } : {}),
        country_code: '+57',
      });
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al registrarse';
      setError(msg);
      if (msg.toLowerCase().includes('ya está registrado') || msg.toLowerCase().includes('ya existe')) setEmailExists(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="register-wrapper">
      {/* ── Panel izquierdo: Formulario ─────────────────────────── */}
      <div className="register-left">

        {/* Botón volver */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, marginBottom: 32, textDecoration: 'none', fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al inicio
        </Link>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', lineHeight: 1 }}>CASPETE</div>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loncheras Escolares Inteligentes</div>
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 4, letterSpacing: '-0.5px' }}>Crear cuenta</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Únete a la comunidad Caspete</p>

        <form onSubmit={handleSubmit}>
          {/* Nombre y Apellido */}
          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label" htmlFor="firstName">Nombre(s)</label>
              <input id="firstName" name="firstName" className="form-input" type="text" value={form.firstName} onChange={handleChange} required placeholder="Juan" autoComplete="given-name" />
            </div>
            <div>
              <label className="form-label" htmlFor="lastName">Apellido(s)</label>
              <input id="lastName" name="lastName" className="form-input" type="text" value={form.lastName} onChange={handleChange} required placeholder="García" autoComplete="family-name" />
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label" htmlFor="email">Correo electrónico</label>
              <input id="email" name="email" className="form-input" type="email" value={form.email} onChange={handleChange} required placeholder="tu@correo.com" autoComplete="email" />
            </div>
            <div>
              <label className="form-label" htmlFor="phone">Teléfono <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opc.)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: '#fff', transition: 'border-color 0.2s' }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = '#1a4731')}
                onBlurCapture={e => (e.currentTarget.style.borderColor = '#d1d5db')}
              >
                <span style={{ padding: '0 10px', fontSize: 14, fontWeight: 600, color: '#374151', background: '#f3f4f6', borderRight: '1px solid #d1d5db', height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>🇨🇴 +57</span>
                <input
                  id="phone" name="phone" type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="300 123 4567"
                  autoComplete="tel-national"
                  maxLength={10}
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 12px', fontSize: 14, color: '#111827', background: 'transparent', minWidth: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label" htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input id="password" name="password" className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required minLength={8} placeholder="Mín. 8 caracteres" autoComplete="new-password" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="confirmPassword">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input id="confirmPassword" name="confirmPassword" className="form-input" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} required placeholder="Repite la contraseña" autoComplete="new-password" style={{ paddingRight: 44, borderColor: !passwordsMatch ? '#ef4444' : undefined }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {!passwordsMatch && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ No coinciden</p>}
              {passwordsMatch && form.confirmPassword.length > 0 && <p style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>✓ Coinciden</p>}
            </div>
          </div>

          {/* Tipo de usuario */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Tipo de usuario</label>
            <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {ROLE_OPTIONS.map((opt, idx) => (
                <button key={idx} type="button" onClick={() => setForm(p => ({ ...p, roleIndex: idx }))}
                  style={{ border: `2px solid ${form.roleIndex === idx ? '#1a4731' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 8px', background: form.roleIndex === idx ? 'rgba(26,71,49,0.07)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: form.roleIndex === idx ? '#1a4731' : '#374151', lineHeight: 1.3 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12 }}>
              <p className="form-error">{error}</p>
              {emailExists && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' }}>
                  <Link to={`/forgot-password?email=${encodeURIComponent(form.email)}`} style={{ color: '#1a4731', fontWeight: 600 }}>Recuperar contraseña</Link>
                  {' '}·{' '}
                  <Link to="/login" style={{ color: '#1a4731', fontWeight: 600 }}>Iniciar sesión</Link>
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !passwordsMatch} style={{ marginBottom: 8 }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
          </button>
        </form>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>o regístrate con</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* Botón de Google */}
        <a
          href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/google`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '10px 16px', border: '1px solid #e5e7eb',
            borderRadius: 8, background: '#fff', cursor: 'pointer', textDecoration: 'none',
            color: '#374151', fontSize: 14, fontWeight: 500, transition: 'border-color 0.2s, box-shadow 0.2s',
            marginBottom: 16,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1a4731'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 0 2px rgba(26,71,49,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuar con Google
        </a>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#1a4731', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>

      {/* ── Panel derecho: Visual ─────────────────────────────────── */}
      <div className="register-right">

        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Contenido central */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎒</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Loncheras sanas,<br />padres tranquilos.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 40 }}>
            Caspete conecta a padres, colegios y tenderos en un ecosistema digital para garantizar una alimentación saludable para tus hijos.
          </p>

          {/* Beneficios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {[
              { icon: '✅', text: 'Programa loncheras saludables con anticipación' },
              { icon: '🔒', text: 'Entregas verificadas con código OTP' },
              { icon: '💳', text: 'Control de saldo y pagos digitales' },
              { icon: '📊', text: 'Reportes de alimentación para tu colegio' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 40 }}>
            {[
              { value: '500+', label: 'Familias' },
              { value: '50+', label: 'Colegios' },
              { value: '98%', label: 'Satisfacción' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px 12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
