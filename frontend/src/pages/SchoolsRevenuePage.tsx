import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface SchoolRevenue {
  school_id: string;
  name: string;
  city: string;
  active: boolean;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  students_count: number;
  orders_month: number;
  revenue_today: number;
  revenue_month: number;
  revenue_year: number;
}

type SortKey = 'name' | 'revenue_today' | 'revenue_month' | 'revenue_year' | 'students_count';

const PLAN_LABELS: Record<string, string> = { BASIC: 'Mensual', STANDARD: 'Comisión', PREMIUM: 'Premium' };

function fmt(n: number) { return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }

export default function SchoolsRevenuePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SchoolRevenue[] | null>(null);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('revenue_month');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(() => {
    apiClient.get<{ data: SchoolRevenue[] }>('/reports/schools-revenue')
      .then(r => { setRows(r.data.data); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar los ingresos por colegio'));
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30_000); return () => clearInterval(i); }, [fetchData]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    if (!rows) return [];
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    if (!rows) return null;
    return rows.reduce((acc, r) => ({
      today: acc.today + r.revenue_today,
      month: acc.month + r.revenue_month,
      year: acc.year + r.revenue_year,
      students: acc.students + r.students_count,
    }), { today: 0, month: 0, year: 0, students: 0 });
  }, [rows]);

  function SortHeader({ label, k, align = 'right' }: { label: string; k: SortKey; align?: 'left' | 'right' }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => toggleSort(k)}
        style={{
          padding: '10px 12px', textAlign: align, cursor: 'pointer', userSelect: 'none',
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px',
          color: active ? 'var(--color-brand-deep)' : 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {label} {active && (sortDir === 'desc' ? '↓' : '↑')}
      </th>
    );
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}><span className="desktop-only">Cerrar sesión</span><span className="mobile-only">Salir</span></button>
        </div>
      </nav>
      <main className="dashboard-body">
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Administración</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Ingresos por colegio</h1>
        </div>

        {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

        {totals && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos hoy</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#059669' }}>{fmt(totals.today)}</p>
            </div>
            <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos del mes</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#6366f1' }}>{fmt(totals.month)}</p>
            </div>
            <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos del año</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(totals.year)}</p>
            </div>
            <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Colegios</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{rows?.length ?? 0}</p>
            </div>
          </div>
        )}

        {!rows && !error && <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>}

        {rows && rows.length === 0 && (
          <div className="user-card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Todavía no hay colegios registrados.</p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="user-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <SortHeader label="Colegio" k="name" align="left" />
                  <SortHeader label="Estudiantes" k="students_count" />
                  <SortHeader label="Hoy" k="revenue_today" />
                  <SortHeader label="Este mes" k="revenue_month" />
                  <SortHeader label="Este año" k="revenue_year" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.school_id} style={{ borderBottom: '1px solid var(--color-border)', opacity: r.active ? 1 : 0.55 }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}{!r.active && ' (inactivo)'}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.city} · {PLAN_LABELS[r.plan]} · {r.orders_month} pedidos este mes</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{r.students_count}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, color: '#059669' }}>{fmt(r.revenue_today)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{fmt(r.revenue_month)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{fmt(r.revenue_year)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
