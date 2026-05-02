import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import type { AuthUser } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  PARENT: 'Padre / Madre de familia',
  VENDOR: 'Tendero',
  SCHOOL_ADMIN: 'Administrador de colegio',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'PARENT' as AuthUser['role'],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        ...(form.phone ? { phone: form.phone } : {}),
      });
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? 'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, marginBottom: 24 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', marginTop: 4 }}>CASPETE</span>
          <span style={{ fontSize: 8, fontWeight: 500, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loncheras Escolares Inteligentes</span>
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Empieza a gestionar loncheras escolares</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              className="form-input"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Juan García"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              className="form-input"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              className="form-input"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Teléfono{' '}
              <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                (opcional)
              </span>
            </label>
            <input
              id="phone"
              name="phone"
              className="form-input"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+573001234567"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">
              Tipo de usuario
            </label>
            <select
              id="role"
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
