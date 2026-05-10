import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Store {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  school: { id: string; name: string; city: string; plan: string };
  _count: { store_products: number; lunch_orders: number };
}

interface StoresResponse {
  stores: Store[];
  total: number;
  page: number;
  pages: number;
}

interface StoreStats {
  total: number;
  active: number;
  inactive: number;
  products: number;
  orders: number;
}

export default function StoresPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StoresResponse | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';


  // ─── Data fetching ──────────────────────────────────────────────

  const fetchStores = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg));
    p.set('limit', '20');
    if (search) p.set('search', search);
    if (filterActive) p.set('active', filterActive);
    apiClient.get<{ data: StoresResponse }>(`/stores?${p}`)
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar tiendas'))
      .finally(() => setLoading(false));
  }, [search, filterActive]);

  useEffect(() => { fetchStores(page); }, [fetchStores, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchStores(1); }, 350); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    if (!isAdmin) return;
    apiClient.get<{ data: StoreStats }>('/stores/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {});
  }, [isAdmin]);

  // ─── Actions ────────────────────────────────────────────────────

  async function handleToggle(store: Store) {
    try {
      if (store.active) {
        await apiClient.delete(`/stores/${store.id}`);
      } else {
        await apiClient.patch(`/stores/${store.id}/reactivate`);
      }
      fetchStores(page);
      // Refresh stats
      if (isAdmin) apiClient.get<{ data: StoreStats }>('/stores/stats').then(r => setStats(r.data.data)).catch(() => {});
    } catch {
      alert('Error al cambiar estado de la tienda');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/stores/${deleteTarget.id}/permanent`);
      setDeleteTarget(null);
      fetchStores(page);
      if (isAdmin) apiClient.get<{ data: StoreStats }>('/stores/stats').then(r => setStats(r.data.data)).catch(() => {});
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error desconocido al eliminar';
      alert(`No se pudo eliminar: ${msg}`);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ─── Derived ────────────────────────────────────────────────────

  const hasFilters = !!(search || filterActive);

  const statCards = useMemo(() => {
    if (!stats) return null;
    return [
      { label: 'Total tiendas', value: stats.total, icon: '🏪', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
      { label: 'Activas',       value: stats.active, icon: '✅', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
      { label: 'Inactivas',     value: stats.inactive, icon: '⏸',  color: '#c37d0d', bg: 'rgba(195,125,13,0.08)' },
      { label: 'Productos',     value: stats.products, icon: '📦', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
      { label: 'Pedidos',       value: stats.orders,   icon: '🧾', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
    ];
  }, [stats]);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            <span className="desktop-only">Cerrar sesión</span>
            <span className="mobile-only">Salir</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        {/* ── Header ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p className="dashboard-label">Gestión</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Tiendas</h1>
          </div>
          {isAdmin && (
            <Link to="/stores/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
              + Nueva tienda
            </Link>
          )}
        </div>

        {/* ── Stat cards ─────────────────────── */}
        {statCards && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
            {statCards.map(s => (
              <div key={s.label} className="user-card" style={{ padding: '16px 14px', marginBottom: 0, textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 24 }}>{s.icon}</p>
                <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ─────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Buscar tienda o colegio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
          />
          <select
            className="form-select"
            value={filterActive}
            onChange={e => { setFilterActive(e.target.value); setPage(1); }}
            style={{ width: 160, marginBottom: 0 }}
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
          {hasFilters && (
            <button className="btn-ghost" style={{ fontSize: 13, padding: '7px 12px', color: 'var(--color-text-muted)' }} onClick={() => { setSearch(''); setFilterActive(''); setPage(1); }}>
              Limpiar filtros ×
            </button>
          )}
        </div>

        {/* ── Loading / Error / Empty ─────── */}
        {loading && <div className="roadmap-note">Cargando tiendas...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && data && data.stores.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 32 }}>🏪</p>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>
              {hasFilters ? 'No se encontraron tiendas' : 'No hay tiendas registradas'}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              {hasFilters ? 'Intenta con otros filtros' : 'Comienza registrando la primera tienda'}
            </p>
            {!hasFilters && isAdmin && (
              <Link to="/stores/new" className="btn-primary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>+ Crear tienda</Link>
            )}
          </div>
        )}

        {/* ── Store list ──────────────────────── */}
        {!loading && data && data.stores.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.stores.map(store => (
              <div key={store.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0, opacity: store.active ? 1 : 0.65, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  {/* Left: Store info */}
                  <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 200 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: store.active ? 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))' : 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                      🏪
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.34px' }}>{store.name}</h2>
                        {!store.active && (
                          <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>Inactiva</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--color-text-muted)' }}>
                        📍 {store.school.name} — {store.school.city}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>📦 {store._count.store_products} productos</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>🧾 {store._count.lunch_orders} pedidos</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                          {new Date(store.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Link to={`/stores/${store.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>✏️ Editar</Link>
                    <button
                      className="btn-ghost"
                      style={{
                        fontSize: 13, padding: '5px 14px',
                        color: store.active ? '#c37d0d' : 'var(--color-brand-deep)',
                        borderColor: store.active ? 'rgba(195,125,13,0.2)' : 'rgba(24,226,153,0.3)',
                      }}
                      onClick={() => handleToggle(store)}
                    >
                      {store.active ? '⏸ Desactivar' : '▶ Activar'}
                    </button>
                    <button
                      className="btn-ghost"
                      style={{
                        fontSize: 13, padding: '5px 14px',
                        color: '#dc2626',
                        borderColor: 'rgba(220,38,38,0.3)',
                        background: 'rgba(220,38,38,0.05)',
                      }}
                      onClick={() => setDeleteTarget(store)}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────── */}
        {data && data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{data.page} / {data.pages}</span>
            <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}

        {/* ── Count ───────────────────────────── */}
        {!loading && data && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            {data.total} tienda{data.total !== 1 ? 's' : ''} en total
          </p>
        )}
      </main>

      {/* ── Delete confirmation modal ──────── */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>¿Eliminar tienda?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Se eliminará <strong>"{deleteTarget.name}"</strong> junto con todos sus productos,
                pedidos y transacciones asociadas.
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
                style={{
                  flex: 1, padding: '10px 20px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600,
                  fontSize: 14, cursor: deleteLoading ? 'wait' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
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
