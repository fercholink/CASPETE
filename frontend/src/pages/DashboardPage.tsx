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
interface SchoolAdminSummary {
  orders_today: number; orders_pending: number; orders_confirmed: number;
  orders_delivered_today: number; revenue_today: number; revenue_month: number;
  active_students: number;
  top_products: { product_id: string; name: string; price: string; total_qty: number }[];
  stores_performance: { store_id: string; name: string; revenue_today: number; revenue_month: number; revenue_year: number }[];
  acquisition_model?: string;
  commission_rate?: number;
  monthly_fee?: number;
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
const QUICK_LINKS: Partial<Record<string, { to: string; label: string; icon: string; isSetup?: boolean }[]>> = {
  SUPER_ADMIN: [
    // --- Configuración Inicial ---
    { to: '/schools',         label: '1. Colegios',          icon: '🏫', isSetup: true },
    { to: '/payment-methods', label: '2. Métodos de Pago',   icon: '🏦', isSetup: true },
    { to: '/suppliers',       label: '3. Proveedores',        icon: '🏭', isSetup: true },
    { to: '/products',        label: '4. Productos',          icon: '🍱', isSetup: true },
    { to: '/ley2120',         label: '5. Ley 2120',           icon: '⬛', isSetup: true },
    { to: '/users',           label: '6. Usuarios',           icon: '👥', isSetup: true },
    { to: '/stores',          label: '7. Tiendas',            icon: '🏪', isSetup: true },
    { to: '/students',        label: '8. Estudiantes',        icon: '🎒', isSetup: true },
    // --- Operación Diaria ---
    { to: '/monthly-menu',    label: 'Menú del Mes',         icon: '🍽️' },
    { to: '/school-leads',    label: 'Solicitudes',          icon: '📥' },
    { to: '/orders',          label: 'Pedidos',              icon: '📋' },
    { to: '/topup-requests',  label: 'Recargas',             icon: '💰' },
    { to: '/transactions',    label: 'Transacciones',        icon: '📊' },
  ],
  SCHOOL_ADMIN: [
    // --- Configuración Inicial ---
    { to: '/products',       label: '1. Productos',     icon: '🍱', isSetup: true },
    { to: '/ley2120',        label: '2. Ley 2120',      icon: '⬛', isSetup: true },
    { to: '/users',          label: '3. Usuarios',      icon: '👥', isSetup: true },
    { to: '/courses',        label: '4. Cursos',        icon: '📚', isSetup: true },
    { to: '/stores',         label: '5. Tiendas',       icon: '🏪', isSetup: true },
    { to: '/students',       label: '6. Estudiantes',   icon: '🎒', isSetup: true },
    // --- Operación Diaria ---
    { to: '/orders',         label: 'Pedidos',          icon: '📋' },
    { to: '/monthly-menu',   label: 'Menú del Mes',     icon: '🍽️' },
  ],
  VENDOR: [
    { to: '/stores',   label: 'Mi Tienda',       icon: '🏪' },
    { to: '/orders',   label: 'Pedidos del día', icon: '📋' },
    { to: '/products', label: 'Catálogo global', icon: '🍱' },
  ],
  TEACHER: [
    { to: '/teacher/dashboard', label: 'Mi Panel',       icon: '👩‍🏫' },
    { to: '/communications',     label: 'Comunicados',    icon: '📬' },
  ],
  PARENT: [
    { to: '/students',    label: 'Mis hijos',     icon: '🎒' },
    { to: '/orders',      label: 'Mis pedidos',   icon: '📋' },
    { to: '/orders/new',  label: 'Nuevo pedido',  icon: '✨' },
    { to: '/monthly-menu',label: 'Menú del Mes',  icon: '🍽️' },
    { to: '/tracking',    label: 'Rastreo GPS',   icon: '📍' },
    { to: '/grades',      label: 'Calificaciones',icon: '📊' },
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

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 15_000); return () => clearInterval(i); }, [fetchAll]);

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
            <StatCard label="Ingresos del mes"    value={fmt(global.revenue.month)} icon="📈" color="#6366f1" to="/schools-revenue" />
            <StatCard label="Pedidos hoy"         value={global.orders_today}       icon="📋"              to="/orders" />
          </div>

          {global.top_schools.length > 0 && (
            <div className="user-card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="dashboard-label" style={{ margin: 0 }}>Top colegios — ingresos del mes</p>
                <Link to="/schools-revenue" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-deep)', textDecoration: 'none' }}>Ver todos los colegios →</Link>
              </div>
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

          {/* Tarjeta Ley 2120 */}
          <Link to="/ley2120" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <div className="user-card" style={{ padding: '16px 20px', marginBottom: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #374151 100%)', border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <svg width={36} height={36} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                  <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="white" />
                </svg>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff' }}>Dashboard Ley 2120</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Cumplimiento nutricional · Sellos · Proveedores · KPIs</p>
                </div>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>→</span>
              </div>
            </div>
          </Link>

          {/* Tarjeta Privacidad & Compliance — Ley 1581 */}
          <Link to="/privacy-compliance" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <div className="user-card" style={{ padding: '16px 20px', marginBottom: 0, background: 'linear-gradient(135deg, #1a2e1a 0%, #14532d 100%)', border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,80,0,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 32, flexShrink: 0 }}>🔐</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff' }}>Privacidad & Compliance</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Audit Log · Consentimientos cookies · Solicitudes ARCO · Ley 1581/2012</p>
                </div>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>→</span>
              </div>
            </div>
          </Link>

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
  const [data, setData] = useState<SchoolAdminSummary | null>(null);

  const fetch = useCallback(() => {
    apiClient.get<{ data: SchoolAdminSummary }>('/reports/school-summary').then(r => setData(r.data.data)).catch(() => {});
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
        <StatCard label="Ingresos hoy"       value={fmt(data.revenue_today)}     icon="💵" color="#059669" />
        <StatCard label="Ingresos del mes"   value={fmt(data.revenue_month)}     icon="📈" color="#6366f1" />
        <StatCard label="Estudiantes activos"value={data.active_students}        icon="🎒"              to="/students" />
      </div>

      {/* Facturación y Comisiones */}
      <div className="user-card" style={{ marginBottom: 20, padding: '20px 24px', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <p className="dashboard-label" style={{ margin: 0, fontSize: 16 }}>Facturación de Caspete</p>
        </div>
        
        {data.acquisition_model === 'COMMISSION' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--color-gray-100)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Comisión Acordada</p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--color-brand-deep)' }}>
                {data.commission_rate ?? 0}%
              </p>
            </div>
            <div style={{ background: 'rgba(212,86,86,0.08)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Descuento Caspete (Hoy)</p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                {fmt(data.revenue_today * ((data.commission_rate ?? 0) / 100))}
              </p>
            </div>
            <div style={{ background: 'rgba(5,150,105,0.08)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Saldo a Consignar por Caspete (Hoy)</p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#059669' }}>
                {fmt(data.revenue_today - (data.revenue_today * ((data.commission_rate ?? 0) / 100)))}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--color-gray-100)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Modelo de Facturación</p>
              <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>Pago Mensual</p>
            </div>
            <div style={{ background: 'rgba(212,86,86,0.08)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Valor Pendiente de Pago</p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                {fmt(data.monthly_fee ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tarjeta Ley 2120 */}
      <Link to="/ley2120" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
        <div className="user-card" style={{ padding: '16px 20px', marginBottom: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #374151 100%)', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width={32} height={32} viewBox="0 0 100 100" style={{ flexShrink: 0 }}><polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="white" /></svg>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#fff' }}>Dashboard Ley 2120</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Cumplimiento · Sellos · Proveedores</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>→</span>
          </div>
        </div>
      </Link>

      {/* Rendimiento de Tiendas */}
      {data.stores_performance && data.stores_performance.length > 0 && (
        <div className="user-card" style={{ marginBottom: 20 }}>
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Rendimiento de Tiendas / Cafeterías</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '8px 0', fontWeight: 600 }}>Tienda</th>
                  <th style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>Hoy</th>
                  <th style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>Este Mes</th>
                  <th style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>Este Año</th>
                </tr>
              </thead>
              <tbody>
                {data.stores_performance.map((store) => (
                  <tr key={store.store_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 500 }}>{store.name}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{fmt(store.revenue_today)}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#6366f1', fontWeight: 600 }}>{fmt(store.revenue_month)}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(store.revenue_year)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.top_products && data.top_products.length > 0 && (
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

interface Novedad {
  kind: 'chat' | 'order';
  type: string;
  icon: string;
  id: string;
  student_name: string;
  student_grade: string | null;
  message: string;
  scheduled_date: string | null;
  total_amount: { toString(): string } | null;
  updated_at: string;
  unread_count?: number;
  order_id?: string | null;
}

const NOVEDAD_STYLES: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  chat:    { bg: 'rgba(99,102,241,0.05)', border: 'rgba(99,102,241,0.35)',  badge: '#6366f1', label: 'Mensaje' },
  pickup:  { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.35)', badge: '#3b82f6', label: 'Retiro' },
  donate:  { bg: 'rgba(236,72,153,0.05)', border: 'rgba(236,72,153,0.35)', badge: '#ec4899', label: 'Donación' },
  gift:    { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.35)', badge: '#f59e0b', label: 'Regalo' },
};

function VendorNovedadesPanel() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const navigate = useNavigate();

  const fetchNovedades = useCallback(() => {
    apiClient
      .get<{ success: boolean; data: { novedades: Novedad[]; total: number } }>('/orders/novedades')
      .then(r => { if (r.data.success) setNovedades(r.data.data.novedades); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNovedades();
    const i = setInterval(fetchNovedades, 10_000);
    return () => clearInterval(i);
  }, [fetchNovedades]);

  if (novedades.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p className="dashboard-label" style={{ margin: 0 }}>🔔 Novedades de padres</p>
          <span style={{ background: '#dc2626', color: '#fff', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
            {novedades.length}
          </span>
        </div>
        <button
          onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-brand)', fontWeight: 600, padding: 0 }}
        >
          Ver chats →
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {novedades.slice(0, 8).map(nov => {
          const style = NOVEDAD_STYLES[nov.type] ?? NOVEDAD_STYLES['chat'];
          const dateStr = nov.scheduled_date
            ? new Date(nov.scheduled_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
            : null;

          const handleClick = () => {
            if (nov.kind === 'chat') navigate(`/chat/${nov.id}`);
            else navigate(`/orders/${nov.id}`);
          };

          return (
            <div
              key={`${nov.kind}-${nov.id}`}
              onClick={handleClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                background: style.bg,
                border: `2px solid ${style.border}`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              }}
            >
              {/* Icono */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `${style.badge}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {nov.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nov.student_name}
                    {nov.student_grade && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> · {nov.student_grade}</span>}
                  </p>
                  {dateStr && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>· {dateStr}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nov.message}
                </p>
              </div>

              {/* Badge tipo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ background: style.badge, color: '#fff', borderRadius: 999, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                  {style.label}{nov.unread_count ? ` (${nov.unread_count})` : ''}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

      {/* ── Novedades de padres ─────────────────────────────────── */}
      <VendorNovedadesPanel />

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
function ParentDashboard() {
  const [data, setData] = useState<ParentSummary | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    apiClient.get<{ data: ParentSummary }>('/reports/parent').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 10_000); return () => clearInterval(i); }, [fetchData]);

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
  const setupLinks = quickLinks.filter(l => l.isSetup);
  const opsLinks = quickLinks.filter(l => !l.isSetup);
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

        {/* VENDOR: métricas primero, luego accesos rápidos */}
        {user?.role === 'VENDOR' && <VendorDashboard key={refreshKey} />}

        {/* Accesos rápidos */}
        {quickLinks.length > 0 && (
          <>
            {setupLinks.length > 0 ? (
              <>
                <p className="dashboard-label" style={{ marginBottom: 10, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--color-text)' }}>
                  ⚙️ Configuración y Puesta en Marcha (Paso a Paso)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
                  {setupLinks.map(link => (
                    <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                      <div className="user-card" style={{ padding: '16px 14px', marginBottom: 0, cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.15s, transform 0.15s', border: '1px solid rgba(152, 255, 0, 0.15)' }}
                        onMouseEnter={e => { 
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; 
                          (e.currentTarget as HTMLDivElement).style.borderColor = '#10b981';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 15px rgba(152, 255, 0, 0.1)';
                        }}
                        onMouseLeave={e => { 
                          (e.currentTarget as HTMLDivElement).style.transform = 'none'; 
                          (e.currentTarget as HTMLDivElement).style.borderColor = '';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                        }}>
                        <p style={{ margin: '0 0 6px', fontSize: 26 }}>{link.icon}</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{link.label}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {opsLinks.length > 0 && (
                  <>
                    <p className="dashboard-label" style={{ marginBottom: 10 }}>
                      📋 Operación y Gestión Diaria
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
                      {opsLinks.map(link => (
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
              </>
            ) : (
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
          </>
        )}

        {/* Métricas por rol (todos excepto VENDOR que ya se renderizó arriba) */}
        {user?.role === 'SUPER_ADMIN'  && <SuperAdminDashboard key={refreshKey} />}
        {user?.role === 'SCHOOL_ADMIN' && <SchoolAdminDashboard key={refreshKey} />}
        {user?.role === 'PARENT'       && <ParentDashboard key={refreshKey} />}
      </main>
    </>
  );
}
