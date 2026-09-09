import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

interface DemoLead {
  id: string;
  school_name: string;
  city: string;
  contact_name: string;
  contact_email: string;
  demo_school_id: string | null;
}

type Step = 'loading' | 'invalid' | 'form' | 'success';

interface SetupForm {
  full_name: string;
  password: string;
  password_confirm: string;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color = score === 0 ? '#e5e7eb' : score === 1 ? '#ef4444' : score === 2 ? '#f59e0b' : '#22c55e';
  const label = score === 0 ? '' : score === 1 ? 'Débil' : score === 2 ? 'Regular' : 'Segura';

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? color : '#e5e7eb', transition: 'background .3s' }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: 11, color: c.ok ? '#16a34a' : '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
        {label && <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>}
      </div>
    </div>
  );
}

export default function DemoSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [step, setStep] = useState<Step>('loading');
  const [lead, setLead] = useState<DemoLead | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState<SetupForm>({ full_name: '', password: '', password_confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Verificar el token al montar ─────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setStep('invalid');
      setErrorMsg('No se encontró un token en el enlace. Por favor usa el enlace que recibiste por correo.');
      return;
    }

    apiClient
      .get<{ data: DemoLead }>(`/leads/demo/verify?token=${token}`)
      .then((r) => {
        setLead(r.data.data);
        setForm((f) => ({ ...f, full_name: r.data.data.contact_name }));
        setStep('form');
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          'El enlace de configuración es inválido o ya expiró.';
        setErrorMsg(msg);
        setStep('invalid');
      });
  }, [token]);

  // ── Crear cuenta SCHOOL_ADMIN ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (form.password !== form.password_confirm) {
      setSubmitError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setSubmitError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/auth/register', {
        email: lead!.contact_email,
        password: form.password,
        full_name: form.full_name,
        role: 'SCHOOL_ADMIN',
        consent_general: true,
        consent_sensitive: false,
        consent_legal_rep: false,
        // Nota: la cuenta queda sin school_id hasta que el super admin cree el colegio
        // y vincule al usuario. Esto es parte del flujo manual de onboarding.
      });
      setStep('success');
    } catch (err: unknown) {
      setSubmitError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          'Error al crear la cuenta. Por favor intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Renders por estado ────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Verificando tu invitación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px', color: 'var(--color-text)' }}>
              Enlace inválido o expirado
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Si crees que esto es un error, responde al correo que recibiste o contacta a nuestro equipo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: 'var(--color-text)' }}>
              ¡Cuenta creada exitosamente!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 8px', lineHeight: 1.7, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              Tu cuenta de administrador para <strong style={{ color: 'var(--color-text)' }}>{lead?.school_name}</strong> está lista.
              Ya puedes iniciar sesión y comenzar a configurar tu colegio.
            </p>
          </div>

          {/* Próximos pasos */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '20px 24px', margin: '20px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Próximos pasos
            </div>
            {[
              ['1', 'Inicia sesión con tu correo y contraseña'],
              ['2', 'Espera que el equipo de Kidway active tu colegio en el sistema'],
              ['3', 'Comienza a agregar estudiantes, docentes y tiendas'],
            ].map(([num, text]) => (
              <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ minWidth: 24, height: 24, borderRadius: '50%', background: '#1a4731', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {num}
                </div>
                <span style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/login')}
          >
            🔑 Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario de configuración ───────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {/* Header Kidway */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🎒</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>KIDWAY</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loncheras Escolares Inteligentes</div>
      </div>

      <div style={cardStyle}>
        {/* Banner colegio */}
        <div style={{ background: 'linear-gradient(135deg, rgba(26,71,49,0.08), rgba(45,106,79,0.06))', border: '1px solid rgba(26,71,49,0.15)', borderRadius: 12, padding: '18px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>🏫</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{lead?.school_name}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{lead?.city}</div>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(22,197,94,0.1)', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            Demo activa
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.3px', color: 'var(--color-text)' }}>
          Configura tu cuenta
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Crea tu contraseña de administrador para <strong style={{ color: 'var(--color-text)' }}>{lead?.school_name}</strong>.
          Usarás este correo para iniciar sesión: <strong style={{ color: 'var(--color-text)' }}>{lead?.contact_email}</strong>
        </p>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label className="form-label">Tu nombre completo</label>
            <input
              id="demo-full-name"
              className="form-input"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
              placeholder="Ej: Carlos Rodríguez Mora"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              value={lead?.contact_email ?? ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
              Este correo fue registrado en tu solicitud y no puede cambiarse aquí.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="demo-password"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)' }}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              id="demo-password-confirm"
              className="form-input"
              type={showPass ? 'text' : 'password'}
              value={form.password_confirm}
              onChange={(e) => setForm((f) => ({ ...f, password_confirm: e.target.value }))}
              required
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              style={{ borderColor: form.password_confirm && form.password !== form.password_confirm ? '#ef4444' : undefined }}
            />
            {form.password_confirm && form.password !== form.password_confirm && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>Las contraseñas no coinciden</span>
            )}
          </div>

          {submitError && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p className="form-error" style={{ margin: 0 }}>{submitError}</p>
            </div>
          )}

          <button
            id="demo-submit"
            type="submit"
            className="btn-primary"
            disabled={submitting || form.password !== form.password_confirm}
            style={{ width: '100%', marginTop: 8 }}
          >
            {submitting ? 'Creando cuenta...' : '🏫 Crear mi cuenta de administrador'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
          Al crear tu cuenta aceptas los{' '}
          <a href="/condiciones" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Términos de Servicio</a>
          {' '}y la{' '}
          <a href="/privacidad" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Política de Privacidad</a>
          {' '}de Kidway.
        </p>
      </div>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
  background: 'var(--color-bg)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 20,
  padding: '36px 32px',
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
};
