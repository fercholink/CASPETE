import { Link } from 'react-router-dom';

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

const plans = [
  {
    name: '⚡ Básico', price: 'Gratis', sub: 'para empezar',
    color: '#f0fdf4', border: '#bbf7d0', btn: '#1a4731', btnTxt: '#fff',
    items: ['1 tienda', 'Hasta 200 estudiantes', '2 admins', 'Reportes básicos', 'Soporte por email'],
  },
  {
    name: '⭐ Estándar', price: '$89.900', sub: '/ mes por colegio',
    color: '#1a4731', border: '#2d7a55', btn: '#18E299', btnTxt: '#0d1f16',
    highlight: true,
    items: ['3 tiendas', 'Hasta 500 estudiantes', '5 admins', 'Reportes avanzados', 'Notificaciones push', 'Personalización de logo'],
  },
  {
    name: '👑 Premium', price: '$179.900', sub: '/ mes por colegio',
    color: '#0d1f16', border: '#2d7a55', btn: '#18E299', btnTxt: '#0d1f16',
    items: ['Tiendas ilimitadas', 'Estudiantes ilimitados', 'Admins ilimitados', 'Reportes completos + exportación', 'Chat prioritario', 'API / Integraciones externas'],
  },
];

export default function LandingPage() {
  return (
    <div className="landing-wrapper">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <Logo size={26} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="landing-nav-link">Iniciar sesión</Link>
          <Link to="/register" className="btn-primary-landing">Registrarme gratis</Link>
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

      {/* ── Planes ── */}
      <section style={{ padding: '100px 48px', background: '#fafdfb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>Planes</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 0', color: '#0d1f16' }}>Elige tu plan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
            {plans.map(p => (
              <div key={p.name} style={{
                padding: 36, borderRadius: 28,
                background: p.color, border: `2px solid ${p.border}`,
                boxShadow: p.highlight ? '0 24px 60px rgba(26,71,49,0.25)' : '0 2px 16px rgba(0,0,0,0.06)',
                transform: p.highlight ? 'scale(1.03)' : 'scale(1)',
              }}>
                {p.highlight && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ background: '#18E299', color: '#0d1f16', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Más popular</span>
                  </div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: p.highlight ? '#fff' : '#0d1f16' }}>{p.name}</h3>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: p.highlight ? '#18E299' : '#1a4731' }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9ca3af', marginLeft: 6 }}>{p.sub}</span>
                </div>
                <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                      <span style={{ color: p.highlight ? '#18E299' : '#1a4731', fontWeight: 800, marginRight: 8 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  background: p.btn, color: p.btnTxt,
                  padding: '13px 0', borderRadius: 12, fontWeight: 700, fontSize: 15,
                }}>
                  Comenzar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
