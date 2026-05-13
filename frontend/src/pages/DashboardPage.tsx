import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  PARENT: 'Padre / Madre de familia', VENDOR: 'Tendero',
  SCHOOL_ADMIN: 'Administrador de colegio', SUPER_ADMIN: 'Super Administrador',
};

function fmt(n: number) { return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }

// ─── Tipos ────────────────────────────────────────────────────
interface AdminSummary {
  orders_today: number; orders_pending: number; orders_confirmed: number;
  orders_delivered_today: number; revenue_today: number; active_students: number;
  top_products: { product_id: string; name: string; total_qty: number }[];
}
interface GlobalStats {
  schools: { total: number; active: number };
  students: { total: number; active: number };
  pending_topups: number;
  revenue: { today: number; month: number };
  orders_today: number;
  top_schools: { school_id: string; name: string; revenue: number }[];
}
interface ParentSummary {
  students: { id: string; full_name: string; grade: string | null; balance: string; school: { name: string } }[];
  total_balance: number;
  recent_orders: { id: string; status: string; total_amount: string; created_at: string; student: { full_name: string } }[];
  pending_topups: number; today_orders: number;
}
interface VendorSummary {
  pending_orders: number; confirmed_orders: number; delivered_today: number;
  revenue_today: number; top_products_today: { name: string; qty: number }[];
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente', color: '#c37d0d' },
  CONFIRMED: { label: 'Confirmado', color: '#6366f1' },
  DELIVERED: { label: 'Entregado', color: '#059669' },
  CANCELLED: { label: 'Cancelado', color: '#dc2626' },
};

// ─── Componente StatCard ──────────────────────────────────────
function StatCard({ label, value, color = 'var(--color-text)', icon, sub, onClick, to }: {
  label: string; value: string | number; color?: string; icon: string; sub?: string;
  onClick?: () => void; to?: string;
}) {
  const navigate = useNavigate();
  const handleClick = onClick ?? (to ? () => navigate(to) : undefined);
  const isClickable = !!handleClick;
  const iconBg = color === 'var(--color-text)' ? 'rgba(0,0,0,0.06)' : `${color}18`;

  return (
    <div
      className="user-card"
      onClick={handleClick}
      style={{
        padding: '16px 18px', marginBottom: 0,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={isClickable ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      } : undefined}
    >
      {/* Fila superior: icono */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, fontSize: 20, lineHeight: 1,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Valor */}
      <p style={{ margin: '0 0 2px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>

      {/* Label */}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.3 }}>{label}</p>

      {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</p>}

      {isClickable && (
        <p style={{ margin: '8px 0 0', fontSize: 10, color, opacity: 0.7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Ver detalles →</p>
      )}
    </div>
  );
}

// ─── Accesos rápidos ──────────────────────────────────────────
const QUICK_LINKS: Partial<Record<string, { to: string; label: string; icon: string }[]>> = {
  SUPER_ADMIN: [
    { to: '/schools',         label: 'Colegios',          icon: '🏫' },
    { to: '/users',           label: 'Usuarios',           icon: '👥' },
    { to: '/students',        label: 'Estudiantes',        icon: '🎒' },
    { to: '/stores',          label: 'Tiendas',            icon: '🏪' },
    { to: '/products',        label: 'Productos',          icon: '🍱' },
    { to: '/orders',          label: 'Pedidos',            icon: '📋' },
    { to: '/topup-requests',  label: 'Recargas',           icon: '💰' },
    { to: '/transactions',    label: 'Transacciones',      icon: '📊' },
    { to: '/payment-methods', label: 'Métodos de pago',   icon: '🏦' },
  ],
  SCHOOL_ADMIN: [
    { to: '/students',       label: 'Estudiantes',   icon: '🎒' },
    { to: '/users',          label: 'Usuarios',      icon: '👥' },
    { to: '/stores',         label: 'Tiendas',       icon: '🏪' },
    { to: '/products',       label: 'Productos',     icon: '🍱' },
    { to: '/orders',         label: 'Pedidos',       icon: '📋' },
    { to: '/topup-requests', label: 'Recargas',      icon: '💰' },
    { to: '/transactions',   label: 'Transacciones', icon: '📊' },
  ],
  VENDOR: [
    { to: '/products', label: 'Mis productos',   icon: '🍱' },
    { to: '/stores',   label: 'Tiendas',         icon: '🏪' },
    { to: '/orders',   label: 'Pedidos del día', icon: '📋' },
  ],
  PARENT: [
    { to: '/students',    label: 'Mis hijos',     icon: '🎒' },
    { to: '/orders',      label: 'Mis pedidos',   icon: '📋' },
    { to: '/orders/new',  label: 'Nuevo pedido',  icon: '✨' },
    { to: '/transactions',label: 'Transacciones', icon: '📊' },
  ],
};

// ─── Vista SUPER ADMIN ────────────────────────────────────────
function SuperAdminDashboard() {
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [admin, setAdmin] = useState<AdminSummary | null>(null);

  const fetchAll = useCallback(() => {
    apiClient.get<{ data: GlobalStats }>('/reports/global').then(r => setGlobal(r.data.data)).catch(() => {});
    apiClient.get<{ data: AdminSummary }>('/reports/summary').then(r => setAdmin(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30_000); return () => clearInterval(i); }, [fetchAll]);

  return (
    <>
      {global && (
        <>
          <p className="dashboard-label" style={{ marginBottom: 10 }}>Sistema global</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <StatCard label="Colegios activos"   value={global.schools.active}    icon="🏫" sub={`${global.schools.total} total`}    to="/schools" />
            <StatCard label="Estudiantes activos" value={global.students.active}   icon="🎒" sub={`${global.students.total} total`}   color="var(--color-brand-deep)" to="/students" />
            <StatCard label="Recargas pendientes" value={global.pending_topups}    icon="⏳"   color={global.pending_topups > 0 ? '#c37d0d' : 'var(--color-text)'} to="/topup-requests" />
            <StatCard label="Ingresos hoy"        value={fmt(global.revenue.today)} icon="💵" color="#059669" to="/transactions" />
            <StatCard label="Ingresos del mes"    value={fmt(global.revenue.month)} icon="📈" color="#6366f1" to="/transactions" />
            <StatCard label="Pedidos hoy"         value={global.orders_today}       icon="📋"              to="/orders" />
          </div>

          {global.top_schools.length > 0 && (
            <div className="user-card" style={{ marginBottom: 20 }}>
              <p className="dashboard-label" style={{ marginBottom: 12 }}>Top colegios — ingresos del mes</p>
              {global.top_schools.map((s, i) => (
                <div key={s.school_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < global.top_schools.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#059669' }}>{fmt(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {admin && (
        <>
          <p className="dashboard-label" style={{ marginBottom: 10 }}>Hoy (todos los colegios)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <StatCard label="Pedidos creados"  value={admin.orders_today}           icon="📋"              to="/orders" />
            <StatCard label="Pendientes"        value={admin.orders_pending}         icon="⏳" color="#c37d0d"  to="/orders?status=PENDING" />
            <StatCard label="Confirmados"       value={admin.orders_confirmed}       icon="✅" color="#6366f1"  to="/orders?status=CONFIRMED" />
            <StatCard label="Entregados"        value={admin.orders_delivered_today} icon="🚀" color="#059669" to="/orders?status=DELIVERED" />
          </div>

          {admin.top_products.length > 0 && (
            <div className="user-card" style={{ marginBottom: 20 }}>
              <p className="dashboard-label" style={{ marginBottom: 12 }}>Top productos (últimos 30 días)</p>
              {admin.top_products.map((p, i) => (
                <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < admin.top_products.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 14 }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-muted)' }}>×{p.total_qty}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Vista SCHOOL ADMIN ───────────────────────────────────────
function SchoolAdminDashboard() {
  const [data, setData] = useState<AdminSummary | null>(null);

  const fetch = useCallback(() => {
    apiClient.get<{ data: AdminSummary }>('/reports/summary').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetch(); const i = setInterval(fetch, 15_000); return () => clearInterval(i); }, [fetch]);

  if (!data) return <div className="roadmap-note">Cargando métricas...</div>;

  return (
    <>
      <p className="dashboard-label" style={{ marginBottom: 10 }}>Hoy en tu colegio</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard label="Pedidos hoy"       value={data.orders_today}           icon="📋"              to="/orders" />
        <StatCard label="Pendientes"         value={data.orders_pending}         icon="⏳" color="#c37d0d"  to="/orders?status=PENDING" />
        <StatCard label="Confirmados"        value={data.orders_confirmed}       icon="✅" color="#6366f1"  to="/orders?status=CONFIRMED" />
        <StatCard label="Entregados hoy"     value={data.orders_delivered_today} icon="🚀" color="#059669" to="/orders?status=DELIVERED" />
        <StatCard label="Ingresos hoy"       value={fmt(data.revenue_today)}     icon="💵" color="#059669" to="/transactions" />
        <StatCard label="Estudiantes activos"value={data.active_students}        icon="🎒"              to="/students" />
      </div>

      {data.top_products.length > 0 && (
        <div className="user-card" style={{ marginBottom: 20 }}>
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Top productos (últimos 30 días)</p>
          {data.top_products.map((p, i) => (
            <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < data.top_products.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14 }}>{p.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-muted)' }}>×{p.total_qty}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Vista VENDOR ─────────────────────────────────────────────
function VendorDashboard() {
  const [data, setData] = useState<VendorSummary | null>(null);
  const navigate = useNavigate();

  const fetch = useCallback(() => {
    apiClient.get<{ data: VendorSummary }>('/reports/vendor').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetch(); const i = setInterval(fetch, 10_000); return () => clearInterval(i); }, [fetch]);

  if (!data) return <div className="roadmap-note">Cargando métricas...</div>;

  return (
    <>
      <p className="dashboard-label" style={{ marginBottom: 10 }}>Tu turno hoy</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard label="Pendientes"     value={data.pending_orders}     icon="⏳" color={data.pending_orders > 0 ? '#c37d0d' : 'var(--color-text)'}  to="/orders?status=PENDING" />
        <StatCard label="Confirmados"    value={data.confirmed_orders}   icon="✅" color="#6366f1"  to="/orders?status=CONFIRMED" />
        <StatCard label="Entregados hoy" value={data.delivered_today}    icon="🚀" color="#059669" to="/orders?status=DELIVERED" />
        <StatCard label="Ingresos hoy"   value={fmt(data.revenue_today)} icon="💵" color="#059669" to="/transactions" />
      </div>

      {data.pending_orders > 0 && (
        <button className="btn-primary" style={{ marginBottom: 16, width: '100%' }} onClick={() => navigate('/orders')}>
          📋 Ver {data.pending_orders} pedido{data.pending_orders !== 1 ? 's' : ''} pendiente{data.pending_orders !== 1 ? 's' : ''}
        </button>
      )}

      {data.top_products_today.length > 0 && (
        <div className="user-card" style={{ marginBottom: 20 }}>
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Más pedidos hoy</p>
          {data.top_products_today.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < data.top_products_today.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ fontSize: 14 }}>{p.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-muted)' }}>×{p.qty}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Vista PARENT ─────────────────────────────────────────────
function ParentDashboard({ onRefresh }: { onRefresh?: () => void }) {
  const [data, setData] = useState<ParentSummary | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    apiClient.get<{ data: ParentSummary }>('/reports/parent').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30_000); return () => clearInterval(i); }, [fetchData]);

  if (!data) return <div className="roadmap-note">Cargando...</div>;

  return (
    <>
      {/* Saldo total */}
      <div className="user-card" style={{ padding: '20px 24px', marginBottom: 20, background: 'linear-gradient(135deg, var(--color-brand-deep) 0%, #5b5df6 100%)', border: 'none' }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo total de tus hijos</p>
        <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>{fmt(data.total_balance)}</p>
        {data.pending_topups > 0 && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>⏳ {data.pending_topups} recarga{data.pending_topups > 1 ? 's' : ''} pendiente{data.pending_topups > 1 ? 's' : ''} de aprobación</p>
        )}
      </div>

      {/* Hijos */}
      {data.students.length > 0 && (
        <>
          <p className="dashboard-label" style={{ marginBottom: 10 }}>Mis hijos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {data.students.map(s => (
              <div key={s.id} className="user-card" style={{ padding: '14px 18px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{s.full_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{s.school.name}{s.grade ? ` · ${s.grade}` : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-mono)', color: parseFloat(s.balance) < 5000 ? '#dc2626' : '#059669' }}>{fmt(parseFloat(s.balance))}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>saldo</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Acción rápida */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/orders/new')}>✨ Nuevo pedido</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/students')}>💰 Recargar saldo</button>
      </div>

      {/* Últimos pedidos */}
      {data.recent_orders.length > 0 && (
        <>
          <p className="dashboard-label" style={{ marginBottom: 10 }}>Últimos pedidos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {data.recent_orders.map(o => {
              const st = ORDER_STATUS[o.status] ?? { label: o.status, color: 'var(--color-text-muted)' };
              return (
                <div key={o.id} className="user-card"
                  onClick={() => navigate(`/orders/${o.id}`)} role="button" style={{ padding: '12px 16px', marginBottom: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="role-badge" style={{ fontSize: 10, background: `${st.color}18`, color: st.color, marginBottom: 4, display: 'inline-block' }}>{st.label}</span>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{o.student.full_name}</p>
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{fmt(parseFloat(o.total_amount))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ─── Dashboard principal ───────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const quickLinks = QUICK_LINKS[user?.role ?? ''] ?? [];
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  }

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
        {/* Header usuario */}
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Panel principal</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>
                Hola, {user?.full_name?.split(' ')[0]} 👋
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span className="role-badge" style={{ fontSize: 11 }}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
                {user?.school && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>🏫 {user.school.name}</span>
                )}
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transition: 'transform 0.6s', transform: refreshing ? 'rotate(360deg)' : 'none' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Accesos rápidos */}
        {quickLinks.length > 0 && (
          <>
            <p className="dashboard-label" style={{ marginBottom: 10 }}>Accesos rápidos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
              {quickLinks.map(link => (
                <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                  <div className="user-card" style={{ padding: '16px 14px', marginBottom: 0, cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                    <p style={{ margin: '0 0 6px', fontSize: 26 }}>{link.icon}</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{link.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Métricas por rol */}
        {user?.role === 'SUPER_ADMIN'  && <SuperAdminDashboard key={refreshKey} />}
        {user?.role === 'SCHOOL_ADMIN' && <SchoolAdminDashboard key={refreshKey} />}
        {user?.role === 'VENDOR'       && <VendorDashboard key={refreshKey} />}
        {user?.role === 'PARENT'       && <ParentDashboard key={refreshKey} />}
      </main>
    </>
  );
}
