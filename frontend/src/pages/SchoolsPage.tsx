import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School {
  id: string;
  name: string;
  nit: string | null;
  city: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  active: boolean;
  created_at: string;
  _count: { users: number; students: number; stores: number; lunch_orders: number };
}

interface SchoolsResponse {
  schools: School[];
  total: number;
  page: number;
  pages: number;
}

const PLAN_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BASIC:    { label: 'Básico',   color: '#64748b', bg: 'rgba(100,116,139,0.08)', icon: '⚡' },
  STANDARD: { label: 'Estándar', color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  icon: '⭐' },
  PREMIUM:  { label: 'Premium',  color: '#9333ea', bg: 'rgba(147,51,234,0.08)', icon: '👑' },
};

export default function SchoolsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SchoolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);
  const isSA = user?.role === 'SUPER_ADMIN';

  const fetchSchools = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg));
    p.set('limit', '20');
    if (search) p.set('search', search);
    if (filterPlan) p.set('plan', filterPlan);
    if (filterActive) p.set('active', filterActive);
    apiClient.get<{ data: SchoolsResponse }>(`/schools?${p}`)
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar colegios'))
      .finally(() => setLoading(false));
  }, [search, filterPlan, filterActive]);

  useEffect(() => { fetchSchools(page); }, [fetchSchools, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchSchools(1); }, 350); return () => clearTimeout(t); }, [search]);

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      total: data.total,
      students: data.schools.reduce((s, sc) => s + sc._count.students, 0),
      stores: data.schools.reduce((s, sc) => s + sc._count.stores, 0),
    };
  }, [data]);

  async function handleToggle(id: string, name: string, active: boolean) {
    if (active && !confirm(`¿Desactivar "${name}"?`)) return;
    try {
      if (active) await apiClient.delete(`/schools/${id}`);
      else await apiClient.patch(`/schools/${id}/reactivate`);
      setData(prev => prev ? { ...prev, schools: prev.schools.map(s => s.id === id ? { ...s, active: !active } : s) } : prev);
    } catch { alert('Error al cambiar estado'); }
  }

  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/schools/${deleteTarget.id}/permanent`);
      setData(prev => prev ? { ...prev, schools: prev.schools.filter(s => s.id !== deleteTarget.id), total: prev.total - 1 } : prev);
      setDeleteTarget(null);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error desconocido al eliminar';
      alert(`No se pudo eliminar: ${msg}`);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}><span className="desktop-only">Cerrar sesión</span><span className="mobile-only">Salir</span></button>
        </div>
      </nav>
      <main className="dashboard-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p className="dashboard-label">Administración</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Colegios</h1>
          </div>
          <Link to="/schools/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>+ Nuevo colegio</Link>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
            {[
              { l: 'Total', v: stats.total, c: 'var(--color-text)' },
              { l: 'Estudiantes', v: stats.students, c: '#3772cf' },
              { l: 'Tiendas', v: stats.stores, c: '#9333ea' },
            ].map(s => (
              <div key={s.l} className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-placeholder)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, NIT o ciudad..." style={{ paddingLeft: 36, marginBottom: 0 }} />
          </div>
          <select className="form-select" value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 130, marginBottom: 0 }}>
            <option value="">Todos los planes</option>
            <option value="BASIC">⚡ Básico</option>
            <option value="STANDARD">⭐ Estándar</option>
            <option value="PREMIUM">👑 Premium</option>
          </select>
          <select className="form-select" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 120, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando colegios...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && data && data.schools.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 32 }}>🏫</p>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>
              {search || filterPlan || filterActive ? 'No se encontraron colegios' : 'No hay colegios registrados'}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              {search ? 'Intenta con otros filtros' : 'Comienza registrando el primer colegio'}
            </p>
            {!search && !filterPlan && !filterActive && (
              <Link to="/schools/new" className="btn-primary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>+ Crear colegio</Link>
            )}
          </div>
        )}

        {!loading && data && data.schools.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.schools.map(school => {
              const plan = PLAN_CFG[school.plan];
              return (
                <div key={school.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0, opacity: school.active ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 0 }}>
                      {school.logo_url ? (
                        <img src={school.logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🏫</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.34px' }}>{school.name}</h2>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: plan.bg, color: plan.color, fontWeight: 500 }}>{plan.icon} {plan.label}</span>
                          {!school.active && <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>Inactivo</span>}
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--color-text-muted)' }}>
                          📍 {school.city}{school.department ? `, ${school.department}` : ''}
                          {school.nit && <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>NIT {school.nit}</span>}
                        </p>
                        {(school.phone || school.email) && (
                          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                            {school.phone && <span>📞 {school.phone}</span>}
                            {school.phone && school.email && <span style={{ margin: '0 8px' }}>·</span>}
                            {school.email && <span>✉️ {school.email}</span>}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>👥 {school._count.users}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>🎒 {school._count.students}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>🏪 {school._count.stores}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>📦 {school._count.lunch_orders}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <Link to={`/schools/${school.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>✏️</Link>
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: school.active ? '#c37d0d' : 'var(--color-brand-deep)', borderColor: school.active ? 'rgba(195,125,13,0.2)' : 'rgba(0,128,0,0.2)' }} onClick={() => handleToggle(school.id, school.name, school.active)}>{school.active ? '⏸' : '▶'}</button>
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }} onClick={() => setDeleteTarget(school)}>🗑 Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{data.page} / {data.pages}</span>
            <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
      </main>

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>¿Eliminar permanentemente?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Se eliminará <strong>"{deleteTarget.name}"</strong> junto con todos sus datos:
                tiendas, usuarios, estudiantes y pedidos.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                Esta acción NO se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={deleteLoading} onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                style={{ flex: 1, padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
                disabled={deleteLoading}
                onClick={confirmDelete}
              >
                {deleteLoading ? 'Eliminando...' : '🗑 Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
