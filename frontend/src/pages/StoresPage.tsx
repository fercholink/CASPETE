import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Store {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  school: { id: string; name: string; city: string };
}

export default function StoresPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    apiClient
      .get<{ data: Store[] }>('/stores')
      .then((r) => setStores(r.data.data))
      .catch((e) => setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cargar tiendas'))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(store: Store) {
    const action = store.active ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${store.name}"?`)) return;
    try {
      const r = await apiClient.patch<{ data: Store }>(`/stores/${store.id}`, { active: !store.active });
      setStores((prev) => prev.map((s) => (s.id === store.id ? r.data.data : s)));
    } catch {
      alert(`No se pudo ${action} la tienda`);
    }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p className="dashboard-label">Gestión</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Tiendas</h1>
          </div>
          <Link to="/stores/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
            + Nueva tienda
          </Link>
        </div>

        {loading && <div className="roadmap-note">Cargando tiendas...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && stores.length === 0 && (
          <div className="roadmap-note">
            No hay tiendas registradas.{' '}
            <Link to="/stores/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Crear la primera</Link>
          </div>
        )}

        {!loading && stores.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stores.map((store) => (
              <div key={store.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.32px' }}>{store.name}</h2>
                      {!store.active && (
                        <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>
                          Inactiva
                        </span>
                      )}
                    </div>
                    {isSuperAdmin && (
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {store.school.name} — {store.school.city}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link
                      to={`/stores/${store.id}/edit`}
                      className="btn-ghost"
                      style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}
                    >
                      Editar
                    </Link>
                    <button
                      className="btn-ghost"
                      style={{
                        fontSize: 13, padding: '5px 14px',
                        color: store.active ? 'var(--color-error)' : 'var(--color-brand-deep)',
                        borderColor: store.active ? 'rgba(212,86,86,0.2)' : 'rgba(24,226,153,0.3)',
                      }}
                      onClick={() => handleToggle(store)}
                    >
                      {store.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
