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

export default function LandingPage() {
  return (
    <div className="landing-wrapper">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <Logo size={26} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="landing-nav-link">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn-primary-landing">
            Registrarme gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(26,71,49,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(24,226,153,0.08)', pointerEvents: 'none' }} />

        <div className="landing-container landing-hero-content">
          {/* Left */}
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(26,71,49,0.08)', color: '#1a4731',
              padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#18E299', display: 'inline-block' }} />
              Plataforma Escolar Digital
            </span>

            <h1 className="landing-hero-title">
              Loncheras sanas,<br />
              <span style={{ color: '#1a4731' }}>padres tranquilos.</span>
            </h1>

            <p className="landing-hero-subtitle">
              Caspete une a <strong style={{ color: '#1a4731' }}>padres, colegios y niños</strong> en un ecosistema digital. Programa loncheras saludables, controla el saldo y garantiza entregas seguras con código OTP.
            </p>

            {/* Mobile-only image */}
            <div className="mobile-only landing-mobile-hero-img">
              <img
                src="/caspete_mobile_app_mockup.png"
                alt="App de Caspete en el celular"
              />
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

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex' }}>
                {['#fbbf24','#34d399','#60a5fa','#f472b6'].map((c, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: '50%', background: c,
                    border: '2px solid #fff', marginLeft: i > 0 ? -10 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {['M','P','C','A'][i]}
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                <strong style={{ color: '#1a4731' }}>+200 familias</strong> ya confían en Caspete
              </p>
            </div>
          </div>

          {/* Right - Image collage */}
          <div className="landing-hero-image">
            <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
              {/* Main image */}
              <div style={{ borderRadius: 28, overflow: 'hidden', height: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.12)', position: 'relative' }}>
                <img
                  src="/hero-familia.png"
                  alt="Madre entregando lonchera saludable a su hijo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(26,71,49,0.3))' }} />
              </div>

              {/* Floating card 1 */}
              <div style={{
                position: 'absolute', top: -24, left: -48,
                background: '#fff', borderRadius: 20, padding: '14px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a4731' }}>Entrega verificada</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Código OTP confirmado</p>
                </div>
              </div>

              {/* Floating card 2 */}
              <div style={{
                position: 'absolute', bottom: 80, right: -40,
                background: '#1a4731', borderRadius: 20, padding: '14px 20px',
                boxShadow: '0 8px 32px rgba(26,71,49,0.3)',
                color: '#fff',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>🥗 Hoy</p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Ensalada + Fruta + Jugo</p>
              </div>

              {/* Floating card 3 */}
              <div style={{
                position: 'absolute', bottom: -16, left: -24,
                background: '#f0fdf4', borderRadius: 16, padding: '12px 18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(26,71,49,0.1)',
              }}>
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

      {/* ── Cómo funciona (infografía) ── */}
      <section className="landing-how">
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#18E299', textTransform: 'uppercase', letterSpacing: '1px' }}>Proceso</span>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 48px', color: '#fff' }}>¿Cómo funciona Caspete?</h2>
          <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <img
              src="/infografia-proceso.png"
              alt="Cómo funciona Caspete: Padre programa, Plataforma gestiona, Tendero prepara, Estudiante recibe"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── Ecosistema ── */}
      <section className="landing-ecosystem">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-section-header">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>Ecosistema</span>
            <h2 className="landing-section-title">
              Un sistema que funciona<br />para todos
            </h2>
          </div>

          <div className="landing-grid-3">
            {[
              { icon: '👨‍👩‍👧', title: 'Padres', color: '#f0fdf4', border: '#bbf7d0', desc: 'Programa loncheras semanales, recarga saldo digital y recibe notificaciones de cada entrega. Tranquilidad total.', items: ['Programación semanal', 'Recarga de saldo', 'Historial de pedidos'] },
              { icon: '🏫', title: 'Colegios', color: '#eff6ff', border: '#bfdbfe', desc: 'Administra estudiantes, vincula tiendas y monitorea la nutrición de toda la institución desde un panel central.', items: ['Dashboard administrativo', 'Control por grado', 'Reportes de consumo'] },
              { icon: '👦', title: 'Niños', color: '#fff7ed', border: '#fed7aa', desc: 'Llegan al colegio, dan su código único en la tienda y reciben su lonchera. Sin efectivo, sin filas largas.', items: ['Código OTP seguro', 'Sin efectivo', 'Menú saludable garantizado'] },
            ].map((card) => (
              <div key={card.title} style={{
                padding: 36, borderRadius: 24, background: card.color,
                border: `1px solid ${card.border}`, transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{card.icon}</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: '#0d1f16', letterSpacing: '-0.5px' }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.65, margin: '0 0 20px' }}>{card.desc}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {card.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                      <span style={{ color: '#1a4731', fontWeight: 800 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section style={{ padding: '100px 48px', background: 'linear-gradient(180deg, #fafdfb 0%, #f0fdf4 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4731', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Por qué Caspete?</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', margin: '12px 0 0', color: '#0d1f16' }}>Diseñado para la vida real</h2>
          </div>

          <div className="landing-grid-4">
            {[
              { icon: '🥗', title: 'Menús Saludables', desc: 'Productos aprobados por el colegio, sin comida chatarra. Tu hijo come bien, siempre.' },
              { icon: '📱', title: 'Todo desde el celular', desc: 'Gestiona las loncheras de la semana en 3 minutos desde cualquier dispositivo.' },
              { icon: '🔒', title: 'Entrega Segura OTP', desc: 'Sistema de código único para verificar que tu hijo recibe SU lonchera.' },
              { icon: '💰', title: 'Control de gastos', desc: 'Saldo digital recargable. Nunca más "se perdió la plata del recreo".' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid rgba(26,71,49,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#0d1f16' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="landing-cta">
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(24,226,153,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
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
                Digitalizando el bienestar escolar en Colombia. Una lonchera saludable a la vez.
              </p>
            </div>
            {[
              { title: 'Plataforma', links: [{ label: 'Iniciar sesión', to: '/login' }, { label: 'Registrarse', to: '/register' }] },
              { title: 'Legal', links: [{ label: 'Términos de uso', to: '#' }, { label: 'Privacidad', to: '#' }] },
              { title: 'Contacto', links: [{ label: 'hola@caspete.co', to: 'mailto:hola@caspete.co' }, { label: 'Soporte', to: '#' }] },
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
            © 2026 Caspete · Todos los derechos reservados · Hecho con ❤️ en Colombia
          </p>
        </div>
      </footer>
    </div>
  );
}
