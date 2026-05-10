import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  PARENT: 'Padre / Madre de familia',
  VENDOR: 'Tendero',
  SCHOOL_ADMIN: 'Administrador de colegio',
  SUPER_ADMIN: 'Super Administrador',
};

interface QuickLink { to: string; label: string; description: string }

const QUICK_LINKS: Partial<Record<string, QuickLink[]>> = {
  SUPER_ADMIN: [
    { to: '/schools', label: 'Colegios', description: 'Gestionar colegios registrados' },
    { to: '/users', label: 'Usuarios', description: 'Gestionar equipo y accesos' },
    { to: '/students', label: 'Estudiantes', description: 'Ver todos los estudiantes' },
    { to: '/stores', label: 'Tiendas', description: 'Gestionar tiendas' },
    { to: '/products', label: 'Productos', description: 'Ver catálogo de productos' },
    { to: '/orders', label: 'Pedidos', description: 'Ver todos los pedidos' },
    { to: '/topup-requests', label: 'Recargas', description: 'Validar comprobantes' },
    { to: '/payment-methods', label: 'Métodos de pago', description: 'Configurar cuentas bancarias' },
  ],
  SCHOOL_ADMIN: [
    { to: '/students', label: 'Estudiantes', description: 'Ver y recargar saldo' },
    { to: '/users', label: 'Usuarios', description: 'Gestionar equipo del colegio' },
    { to: '/stores', label: 'Tiendas', description: 'Gestionar tiendas del colegio' },
    { to: '/products', label: 'Productos', description: 'Ver catálogo del colegio' },
    { to: '/orders', label: 'Pedidos', description: 'Gestionar pedidos del colegio' },
    { to: '/topup-requests', label: 'Recargas', description: 'Validar comprobantes' },
  ],
  VENDOR: [
    { to: '/products', label: 'Mis productos', description: 'Gestionar tu catálogo' },
    { to: '/stores', label: 'Tiendas', description: 'Ver tiendas del colegio' },
    { to: '/orders', label: 'Pedidos del día', description: 'Ver y entregar pedidos' },
  ],
  PARENT: [
    { to: '/students', label: 'Mis hijos', description: 'Ver y gestionar a tus hijos' },
    { to: '/orders', label: 'Mis pedidos', description: 'Ver pedidos activos' },
    { to: '/orders/new', label: 'Nuevo pedido', description: 'Pedir lonchera para hoy' },
  ],
};

interface Summary {
  orders_today: number;
  orders_pending: number;
  orders_confirmed: number;
  orders_delivered_today: number;
  revenue_today: number;
  active_students: number;
  top_products: { product_id: string; name: string; price: string; total_qty: number }[];
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const quickLinks = QUICK_LINKS[user?.role ?? ''] ?? [];
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [summary, setSummary] = useState<Summary | null>(null);

  const fetchSummary = useCallback(() => {
    if (!isAdmin) return;
    apiClient
      .get<{ data: Summary }>('/reports/summary')
      .then((r) => setSummary(r.data.data))
      .catch(() => { /* métricas opcionales, no bloquear la página */ });
  }, [isAdmin]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => {
      fetchSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>
            <span className="desktop-only">Mi perfil</span>
            <span className="mobile-only">Perfil</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            <span className="desktop-only">Cerrar sesión</span>
            <span className="mobile-only">Salir</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        <p className="dashboard-label">Panel principal</p>

        <div className="user-card">
          <h1 className="user-name">{user?.full_name}</h1>
          <p className="user-email">{user?.email}</p>
          <span className="role-badge">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
          {user?.school && (
            <div className="school-info">
              <strong>{user.school.name}</strong> &mdash; {user.school.city}
            </div>
          )}
        </div>

        {/* Métricas del día — solo admins */}
        {isAdmin && summary && (
          <div style={{ marginBottom: 8 }}>
            <p className="dashboard-label" style={{ marginBottom: 12 }}>Hoy</p>
            <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Pedidos creados', value: summary.orders_today, color: 'var(--color-text)' },
                { label: 'Pendientes', value: summary.orders_pending, color: '#c37d0d' },
                { label: 'Confirmados', value: summary.orders_confirmed, color: 'var(--color-brand-deep)' },
                { label: 'Entregados hoy', value: summary.orders_delivered_today, color: '#3772cf' },
                { label: 'Ingresos hoy', value: fmt(summary.revenue_today), color: 'var(--color-brand-deep)' },
                { label: 'Estudiantes activos', value: summary.active_students, color: 'var(--color-text)' },
              ].map((stat) => (
                <div key={stat.label} className="user-card" style={{ padding: '16px 18px', marginBottom: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color, letterSpacing: '-0.5px' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {summary.top_products.length > 0 && (
              <div className="user-card" style={{ marginBottom: 16 }}>
                <p className="dashboard-label" style={{ marginBottom: 12 }}>Top productos (últimos 30 días)</p>
                {summary.top_products.map((p, i) => (
                  <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < summary.top_products.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ×{p.total_qty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accesos rápidos */}
        {quickLinks.length > 0 && (
          <>
            <p className="dashboard-label" style={{ marginBottom: 12 }}>Accesos rápidos</p>
            <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                  <div
                    className="user-card"
                    style={{ padding: '20px 24px', marginBottom: 0, cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
                      {link.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {link.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
