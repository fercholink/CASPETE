import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface ComplianceDashboard {
  products: {
    total: number; active: number; level1: number; level2: number;
    pct_seal_free: number; recent_audits_30d: number;
  };
  orders: {
    total: number; seal_free: number; sweetener_alerts: number;
    pct_compliant: number; avg_compliance_score: number;
  };
  suppliers: {
    total: number; verified: number; expired_tech_sheets: number; pct_verified: number;
  };
  seal_distribution: {
    sodium: number; sugars: number; saturated_fat: number;
    trans_fat: number; sweeteners: number;
  };
  generated_at: string;
}

// ── Subcomponentes UI ────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = '#2563eb', bg = 'rgba(37,99,235,0.07)' }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; bg?: string;
}) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  );
}

function RingGauge({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 40; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-gray-100)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold">{pct}%</text>
        <text x="50" y="62" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9">cumplimiento</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 90 }}>{label}</span>
    </div>
  );
}

function SealBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 200, flexShrink: 0 }}>
        <svg width={14} height={14} viewBox="0 0 100 100">
          <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="#1a1a1a" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
      </div>
      <div style={{ flex: 1, height: 8, background: 'var(--color-gray-100)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: 30, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Ley2120DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ data: ComplianceDashboard }>('/reports/compliance-dashboard')
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError(e?.response?.data?.error ?? 'Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const maxSeal = data ? Math.max(...Object.values(data.seal_distribution), 1) : 1;

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          {isAdmin && <Link to="/products" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>Productos</Link>}
          {isAdmin && <Link to="/suppliers" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>Proveedores</Link>}
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </nav>

      <main className="dashboard-body" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <svg width={24} height={24} viewBox="0 0 100 100">
              <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="#1a1a1a" />
            </svg>
            <p className="dashboard-label">Cumplimiento Legal</p>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.56px' }}>Dashboard Ley 2120</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Resolución 2492 de 2022 — Etiquetado Frontal de Advertencia
            {data && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>· Actualizado {new Date(data.generated_at).toLocaleString('es-CO')}</span>}
          </p>
        </div>

        {loading && <div className="roadmap-note">Cargando indicadores de cumplimiento...</div>}
        {error && <p className="form-error">{error}</p>}

        {data && (
          <>
            {/* ── KPIs Productos ── */}
            <section style={{ marginBottom: 28 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Catálogo de Productos</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                <KpiCard icon="✅" label="Nivel 1 (Sin sellos)" value={data.products.level1}
                  sub={`${data.products.pct_seal_free}% del catálogo activo`} color="#15803d" bg="rgba(22,163,74,0.08)" />
                <KpiCard icon="⚠️" label="Nivel 2 (Con sellos)" value={data.products.level2}
                  sub={`${100 - data.products.pct_seal_free}% del catálogo activo`} color="#dc2626" bg="rgba(220,38,38,0.08)" />
                <KpiCard icon="🔍" label="Auditorías (30 días)" value={data.products.recent_audits_30d}
                  sub="Productos con datos nutricionales actualizados" color="#2563eb" />
                <KpiCard icon="🏭" label="Total en catálogo" value={data.products.active}
                  sub={`de ${data.products.total} totales`} color="var(--color-text)" bg="var(--color-gray-100)" />
              </div>
            </section>

            {/* ── KPIs Pedidos + Gauges ── */}
            <section style={{ marginBottom: 28 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Loncheras & Pedidos</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="user-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                    <RingGauge pct={data.orders.pct_compliant} label="Loncheras sin sellos" color="#15803d" />
                    <RingGauge pct={data.orders.avg_compliance_score} label="Score cumplimiento" color="#2563eb" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <KpiCard icon="🍱" label="Total pedidos" value={data.orders.total} color="var(--color-text)" bg="var(--color-gray-100)" />
                  <KpiCard icon="🟢" label="Pedidos Nivel 1" value={data.orders.seal_free} color="#15803d" bg="rgba(22,163,74,0.08)" />
                  <KpiCard icon="🍬" label="Alertas edulcorantes" value={data.orders.sweetener_alerts}
                    sub="Pedidos con edulcorantes" color="#ca8a04" bg="rgba(202,138,4,0.08)" />
                  <KpiCard icon="📊" label="Score promedio" value={`${data.orders.avg_compliance_score}/100`} color="#2563eb" />
                </div>
              </div>
            </section>

            {/* ── Distribución de Sellos ── */}
            <section style={{ marginBottom: 28 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Distribución de Sellos (Productos Activos Nivel 2)</p>
              <div className="user-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.products.level2 === 0 ? (
                  <p style={{ margin: 0, fontSize: 14, color: '#15803d', fontWeight: 600 }}>✅ No hay productos activos con sellos de advertencia.</p>
                ) : (
                  <>
                    <SealBar label="Alto en Sodio" count={data.seal_distribution.sodium} max={maxSeal} color="#ef4444" />
                    <SealBar label="Alto en Azúcares" count={data.seal_distribution.sugars} max={maxSeal} color="#f97316" />
                    <SealBar label="Grasas Saturadas" count={data.seal_distribution.saturated_fat} max={maxSeal} color="#eab308" />
                    <SealBar label="Grasas Trans" count={data.seal_distribution.trans_fat} max={maxSeal} color="#8b5cf6" />
                    <SealBar label="Edulcorantes" count={data.seal_distribution.sweeteners} max={maxSeal} color="#ec4899" />
                  </>
                )}
              </div>
            </section>

            {/* ── Proveedores ── */}
            <section style={{ marginBottom: 28 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Trazabilidad de Proveedores (Art. 32 Res. 2492)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                <KpiCard icon="🏭" label="Proveedores activos" value={data.suppliers.total} color="var(--color-text)" bg="var(--color-gray-100)" />
                <KpiCard icon="✅" label="Verificados" value={data.suppliers.verified}
                  sub={`${data.suppliers.pct_verified}% del total`} color="#15803d" bg="rgba(22,163,74,0.08)" />
                <KpiCard icon="⚠️" label="Fichas vencidas / sin ficha" value={data.suppliers.expired_tech_sheets}
                  sub="Requieren actualización urgente" color={data.suppliers.expired_tech_sheets > 0 ? '#dc2626' : '#15803d'} bg={data.suppliers.expired_tech_sheets > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)'} />
                {data.suppliers.expired_tech_sheets > 0 && (
                  <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Acción requerida</p>
                    <Link to="/suppliers?expired_only=true" style={{ fontSize: 12, color: '#dc2626', textDecoration: 'underline' }}>
                      Ver proveedores con fichas vencidas →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* ── Acciones rápidas ── */}
            <section>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Acciones de Cumplimiento</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link to="/products?seal_free=true" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>✅ Ver productos Nivel 1</Link>
                <Link to="/products?level=LEVEL_2" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>⚠️ Ver productos Nivel 2</Link>
                <Link to="/suppliers" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>🏭 Gestionar proveedores</Link>
                <Link to="/products" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>📋 Auditar catálogo</Link>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
