import { Link } from 'react-router-dom';
import { useState } from 'react';

const Logo = ({ size = 28 }: { size?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7M5 7H19C20.1 7 21 7.9 21 9V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V9C3 7.9 3.9 7 5 7Z" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 13H15M9 17H15" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontSize: size * 0.75, fontWeight: 800, color: '#1a4731', letterSpacing: '1px', marginTop: 3 }}>CASPETE</span>
    <span style={{ fontSize: 7, fontWeight: 600, color: '#2d7a55', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Loncheras Escolares Inteligentes</span>
  </div>
);

const CHECK = () => <span style={{ color: '#1a4731', fontWeight: 800, marginRight: 8 }}>✓</span>;

const features = [
  {
    category: 'Para Padres de Familia',
    icon: '👨‍👩‍👧',
    color: '#f0fdf4',
    border: '#bbf7d0',
    items: [
      'Registro con 3 capas de consentimiento (Ley 1581/2012)',
      'Google OAuth — un clic para entrar',
      'Agregar múltiples hijos al mismo perfil',
      'Programar loncheras para la semana',
      'Ver saldo en tiempo real por estudiante',
      'Historial completo de pedidos y transacciones',
      'Recargar saldo vía Nequi Push Payment',
      'Código QR de entrega descargable',
      'Notificaciones push al confirmar y entregar pedidos',
      'Chat directo con el tendero para novedades',
      'Solicitud de eliminación de datos (Derecho al olvido)',
      'Gestión de alergias del estudiante',
    ],
  },
  {
    category: 'Para Tenderos',
    icon: '🏪',
    color: '#fff7ed',
    border: '#fed7aa',
    items: [
      'Panel de pedidos del día en tiempo real',
      'Ver foto del estudiante para verificar identidad',
      'Escanear QR del estudiante para entrega',
      'Ingresar código de 6 dígitos manualmente',
      'Confirmar pedidos individualmente o en masa',
      'Catálogo de productos con precio y stock propio',
      'Iniciar chat con el padre ante cualquier novedad',
      'Notificación push al recibir respuesta del padre',
      'Vista de pedidos pendientes por fecha',
    ],
  },
  {
    category: 'Para Colegios (Admin)',
    icon: '🏫',
    color: '#eff6ff',
    border: '#bfdbfe',
    items: [
      'Dashboard administrativo multi-tienda',
      'Gestión de estudiantes por grado',
      'Control de saldo y recargas por colegio',
      'Aprobar o rechazar solicitudes de recarga',
      'Configurar métodos de pago aceptados',
      'Reportes nutricionales (Ley 2120/2021)',
      'Dashboard de cumplimiento Ley 2120 por tienda',
      'Registro de proveedores con ficha técnica',
      'Ver todos los hilos de chat del colegio',
      'Exportar reportes de consumo',
    ],
  },
  {
    category: 'Seguridad y Cumplimiento Legal',
    icon: '🔐',
    color: '#fdf4ff',
    border: '#e9d5ff',
    items: [
      'JWT 15 min + Refresh Token rotativo 30 días',
      'RBAC: control de acceso por rol en todas las rutas',
      'Módulo ARCO completo (Acceso, Rectificación, Cancelación, Oposición)',
      'Cookie Banner con consentimiento granular',
      'AuditLog de operaciones sobre datos personales',
      'Anonimización automática (cron 02:00 AM)',
      'Limpieza de tokens expirados (cron 03:00 AM)',
      'Registro de brechas con plazo SIC (15 días hábiles)',
      'Reporte SIC exportable en JSON',
      'Etiquetado nutricional con sellos (Res. 2492/2022)',
      'Clasificación LEVEL_1 / LEVEL_2 por producto',
    ],
  },
];

const benefits = [
  { icon: '📱', title: 'PWA — funciona como app', desc: 'Instálala en el celular sin pasar por tiendas. Funciona en iOS y Android con notificaciones push reales.' },
  { icon: '🥗', title: 'Cumplimiento Ley 2120', desc: 'Sellos de advertencia automáticos en cada pedido. Puntaje nutricional por orden, reporte por estudiante.' },
  { icon: '💳', title: 'Pago con Nequi', desc: 'Recarga el saldo del niño desde la app. Flujo asíncrono seguro con confirmación en tiempo real.' },
  { icon: '📷', title: 'Entrega por QR', desc: 'El tendero escanea el QR o ingresa el código de 6 dígitos. Sin papel, sin errores, sin fraude.' },
  { icon: '💬', title: 'Chat Tendero ↔ Padre', desc: 'El tendero reporta novedades directamente al padre. Notificación push instantánea y respuesta desde la app.' },
  { icon: '🇨🇴', title: 'Hecho para Colombia', desc: 'Multitenancy por colegio, zona horaria Bogotá, Nequi, Ley 1581/2012, Ley 2120/2021 y Res. 2492/2022.' },
];

const MODALITIES = [
  {
    key: 'COMMISSION',
    icon: '📊',
    name: 'Modalidad por Comisión',
    tag: 'Sin costo fijo',
    tagColor: '#f0fdf4', tagBorder: '#bbf7d0', tagText: '#16a34a',
    color: '#f8fafc', border: '#e2e8f0', dark: false,
    desc: 'Caspete cobra un porcentaje por cada transacción procesada en la plataforma. Sin mensualidad fija. Ideal para colegios que quieren empezar sin riesgo.',
    items: [
      'Sin costo mensual fijo',
      'Paga solo sobre lo que se vende',
      'Activación inmediata',
      'Todas las funciones incluidas',
      'Soporte por email',
    ],
  },
  {
    key: 'MONTHLY',
    icon: '📅',
    name: 'Modalidad Mensual',
    tag: 'Más popular',
    tagColor: '#18E299', tagBorder: '#18E299', tagText: '#0d1f16',
    color: '#1a4731', border: '#2d7a55', dark: true,
    desc: 'El colegio paga una tarifa mensual fija negociada según el tamaño de la institución. Sin límite de transacciones. Ideal para colegios con alto volumen de pedidos.',
    items: [
      'Tarifa mensual según número de estudiantes',
      'Transacciones ilimitadas',
      'Soporte prioritario',
      'Personalización de logo y colores',
      'Reportes avanzados + exportación',
    ],
  },
];

export default function LandingPage() {
  const [leadModal, setLeadModal] = useState<null | 'COMMISSION' | 'MONTHLY'>(null);
  const [form, setForm] = useState({ school_name: '', nit: '', city: '', contact_name: '', contact_email: '', contact_phone: '', students_count: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setFormError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, students_count: form.students_count ? Number(form.students_count) : undefined, plan_interest: leadModal }),
      });
      const json = await res.json() as { success: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Error al enviar');
      setSent(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al enviar');
    } finally { setSending(false); }
  }

  function openModal(plan: 'COMMISSION' | 'MONTHLY') {
    setForm({ school_name: '', nit: '', city: '', contact_name: '', contact_email: '', contact_phone: '', students_count: '', message: '' });
    setSent(false); setFormError('');
    setLeadModal(plan);
  }

  return (
    <div className="landing-wrapper">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <Logo size={26} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="landing-nav-link">Soy padre — Iniciar sesión</Link>
          <Link to="/register" className="btn-primary-landing">Soy padre — Registrarme gratis</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(26,71,49,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(24,226,153,0.08)', pointerEvents: 'none' }} />

        <div className="landing-container landing-hero-content">
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(26,71,49,0.08)', color: '#1a4731',
              padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#18E299', display: 'inline-block' }} />
              Plataforma Escolar en Producción
            </span>

            <h1 className="landing-hero-title">
              Loncheras sanas,<br />
              <span style={{ color: '#1a4731' }}>padres tranquilos.</span>
            </h1>

            <p className="landing-hero-subtitle">
              Caspete une a <strong style={{ color: '#1a4731' }}>padres, colegios y tenderos</strong> en un ecosistema digital completo. Pago con Nequi, entrega por QR, chat directo y cumplimiento legal total (Ley 1581 + Ley 2120).
            </p>

            <div className="mobile-only landing-mobile-hero-img">
              <img src="/caspete_mobile_app_mockup.png" alt="App de Caspete en el celular" />
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/register" style={{
                textDecoration: 'none', background: '#1a4731', color: '#fff',
                padding: '15px 36px', borderRadius: 99, fontSize: 16, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(26,71,49,0.35)', display: 'inline-block',
              }}>
                Crear cuenta gratis →
              </Link>
              <Link to="/login" style={{
                textDecoration: 'none', background: '#fff', color: '#1a4731',
                padding: '15px 36px', borderRadius: 99, fontSize: 16, fontWeight: 600,
                border: '2px solid rgba(26,71,49,0.2)', display: 'inline-block',
              }}>
                Ya tengo cuenta
              </Link>
            </div>

            {/* Badges de confianza */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['✅ Ley 1581/2012', '🥗 Ley 2120/2021', '💳 Nequi', '📷 QR Seguro', '🔔 Push en tiempo real'].map(b => (
                <span key={b} style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 12px',
                  borderRadius: 99, background: 'rgba(26,71,49,0.07)',
                  color: '#1a4731', border: '1px solid rgba(26,71,49,0.12)',
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="landing-hero-image">
            <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
              <div style={{ borderRadius: 28, overflow: 'hidden', height: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.12)', position: 'relative' }}>
                <img src="/hero-familia.png" alt="Familia usando Caspete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(26,71,49,0.3))' }} />
              </div>
              <div style={{ position: 'absolute', top: -24, left: -48, background: '#fff', borderRadius: 20, padding: '14px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a4731' }}>Entrega verificada</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>QR escaneado · 10:32 am</p>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 80, right: -40, background: '#1a4731', borderRadius: 20, padding: '14px 20px', boxShadow: '0 8px 32px rgba(26,71,49,0.3)', color: '#fff' }}>
                <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>💬 Chat</p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Tendero → Padre</p>
              </div>
              <div style={{ position: 'absolute', bottom: -16, left: -24, background: '#f0fdf4', borderRadius: 16, padding: '12px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(26,71,49,0.1)' }}>
                <span style={{ fontSize: 24 }}>💳</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151' }}>Saldo disponible</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a4731' }}>$45.000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="landing-how">
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#18E299', textTransform: 'uppercase', letterSpacing: '1px' }}>Proceso</span>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 48px', color: '#fff' }}>¿Cómo funciona Caspete?</h2>
          <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <img src="/infografia-proceso.png" alt="Cómo funciona Caspete" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* ── Funciones en producción ── */}
      <section style={{ padding: '100px 48px', background: '#fafdfb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>Funciones reales</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 12px', color: '#0d1f16' }}>Todo lo que ya está funcionando</h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 560, margin: '0 auto' }}>
              No es un prototipo. Es una plataforma de producción con más de 30 funciones activas.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.category} style={{
                padding: 32, borderRadius: 24,
                background: f.color, border: `1px solid ${f.border}`,
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 40, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#0d1f16' }}>{f.category}</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {f.items.map(item => (
                    <li key={item} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      <CHECK />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 beneficios ── */}
      <section style={{ padding: '100px 48px', background: 'linear-gradient(180deg, #f0fdf4 0%, #fafdfb 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Por qué Caspete?</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 0', color: '#0d1f16' }}>Diseñado para la vida real</h2>
          </div>
          <div className="landing-grid-3" style={{ gap: 24 }}>
            {benefits.map(b => (
              <div key={b.title} style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid rgba(26,71,49,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform .2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 38, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#0d1f16' }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para padres: GRATIS ── */}
      <section style={{ padding: '60px 48px 0', background: '#fafdfb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: 'linear-gradient(135deg, #1a4731 0%, #2d7a55 100%)', borderRadius: 28, padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', boxShadow: '0 16px 48px rgba(26,71,49,0.2)' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#18E299', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 10 }}>Para padres de familia</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              La plataforma es<br /><span style={{ color: '#18E299' }}>100% GRATUITA</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
              Los padres de familia no pagan suscripción. Solo recargan el saldo de sus hijos y listo.
            </p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#18E299', lineHeight: 1 }}>$0</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>por suscripción</div>
            <Link to="/register" style={{ display: 'inline-block', marginTop: 20, background: '#18E299', color: '#0d1f16', padding: '13px 32px', borderRadius: 99, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(24,226,153,0.4)' }}>
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Planes para Colegios ── */}
      <section style={{ padding: '80px 48px', background: '#fafdfb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>Colegios e Instituciones</span>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 12px', color: '#0d1f16' }}>Elige la modalidad de tu colegio</h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
              Dos formas de trabajar con Caspete. Ambas incluyen todas las funciones de la plataforma.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'stretch' }}>
            {MODALITIES.map(m => (
              <div key={m.key} style={{ padding: 40, borderRadius: 28, background: m.color, border: `2px solid ${m.border}`, boxShadow: m.dark ? '0 24px 60px rgba(26,71,49,0.2)' : '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 40 }}>{m.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: m.tagColor, color: m.tagText, border: `1px solid ${m.tagBorder}` }}>{m.tag}</span>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 14px', color: m.dark ? '#fff' : '#0d1f16' }}>{m.name}</h3>
                <p style={{ fontSize: 15, color: m.dark ? 'rgba(255,255,255,0.7)' : '#6b7280', lineHeight: 1.65, margin: '0 0 24px' }}>{m.desc}</p>
                <ul style={{ margin: '0 0 32px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {m.items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: m.dark ? 'rgba(255,255,255,0.85)' : '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: m.dark ? '#18E299' : '#1a4731', fontWeight: 800, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal(m.key as 'COMMISSION' | 'MONTHLY')}
                  style={{ display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', background: m.dark ? '#18E299' : '#1a4731', color: m.dark ? '#0d1f16' : '#fff', padding: '14px 0', borderRadius: 12, fontWeight: 800, fontSize: 15, border: 'none' }}
                >
                  Solicitar información
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modal: Formulario colegio interesado ── */}
      {leadModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setLeadModal(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px', color: '#1a4731' }}>¡Recibido!  Gracias</h3>
                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>Nuestro equipo se comunicará con usted en menos de 24 horas para coordinar una demostración.</p>
                <button onClick={() => setLeadModal(null)} style={{ background: '#1a4731', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cerrar</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#0d1f16' }}>Información del colegio</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Modalidad: <strong style={{ color: '#1a4731' }}>{leadModal === 'COMMISSION' ? 'Por Comisión' : 'Mensual'}</strong></p>
                  </div>
                  <button onClick={() => setLeadModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', padding: '4px 8px' }}>✕</button>
                </div>
                <form onSubmit={submitLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nombre del colegio *</label>
                      <input required className="form-input" value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} placeholder="Colegio San José" style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>NIT</label>
                      <input className="form-input" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="900.123.456-1" style={{ fontSize: 14 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ciudad *</label>
                      <input required className="form-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Bogotá" style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>N° de estudiantes</label>
                      <input className="form-input" type="number" min="1" value={form.students_count} onChange={e => setForm(f => ({ ...f, students_count: e.target.value }))} placeholder="320" style={{ fontSize: 14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nombre del administrador / rector *</label>
                    <input required className="form-input" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Dr. Carlos Rodríguez" style={{ fontSize: 14 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Correo electrónico *</label>
                      <input required type="email" className="form-input" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="rector@colegio.edu.co" style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Teléfono / WhatsApp</label>
                      <input className="form-input" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="3001234567" style={{ fontSize: 14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mensaje o comentario adicional</label>
                    <textarea className="form-input" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Cuéntanos sobre las necesidades de su institución..." style={{ fontSize: 14, resize: 'vertical' }} />
                  </div>
                  {formError && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{formError}</p>}
                  <button type="submit" disabled={sending} style={{ background: '#1a4731', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Enviando...' : '📨 Solicitar demostración'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── CTA final ── */}
      <section className="landing-cta">
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(24,226,153,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 20px' }}>
            Empieza hoy.<br />Es completamente gratis.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', margin: '0 0 40px', lineHeight: 1.6 }}>
            Únete a las familias que ya le dicen adiós al estrés de las loncheras.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none', background: '#18E299', color: '#0d1f16', padding: '16px 40px', borderRadius: 99, fontSize: 16, fontWeight: 800, boxShadow: '0 4px 24px rgba(24,226,153,0.4)' }}>
              Crear cuenta gratis
            </Link>
            <Link to="/login" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 40px', borderRadius: 99, fontSize: 16, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 280 }}>
              <Logo size={24} />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.6 }}>
                Digitalizando el bienestar escolar en Colombia.<br />
                Cumplimiento Ley 1581/2012 · Ley 2120/2021.
              </p>
            </div>
            {[
              { title: 'Plataforma', links: [{ label: 'Iniciar sesión', to: '/login' }, { label: 'Registrarse', to: '/register' }] },
              { title: 'Legal', links: [{ label: 'Política de privacidad', to: '/privacy-policy' }, { label: 'Términos de uso', to: '#' }] },
              { title: 'Contacto', links: [{ label: 'hola@caspete.co', to: 'mailto:hola@caspete.co' }, { label: 'privacidad@caspete.com', to: 'mailto:privacidad@caspete.com' }] },
            ].map(col => (
              <div key={col.title}>
                <h5 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 20px' }}>{col.title}</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(link => (
                    <Link key={link.label} to={link.to} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{link.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0, textAlign: 'center' }}>
            © 2026 Caspete · Todos los derechos reservados · Hecho con ❤️ en Colombia · Ley 1581/2012 · Ley 2120/2021
          </p>
        </div>
      </footer>
    </div>
  );
}
