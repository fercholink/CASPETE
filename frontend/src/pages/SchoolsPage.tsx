import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School {
  id: string;
  name: string;
  nit: string | null;
  city: string;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  active: boolean;
  created_at: string;
  _count: { users: number; students: number; stores: number };
}

interface SchoolsResponse {
  schools: School[];
  total: number;
  page: number;
  pages: number;
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  STANDARD: 'Estándar',
  PREMIUM: 'Premium',
};

export default function SchoolsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SchoolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    apiClient
      .get<{ data: SchoolsResponse }>('/schools')
      .then((res) => setData(res.data.data))
      .catch((err) => {
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? 'Error al cargar colegios';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`¿Desactivar el colegio "${name}"?`)) return;
    try {
      await apiClient.delete(`/schools/${id}`);
      setData((prev) =>
        prev ? { ...prev, schools: prev.schools.map((s) => s.id === id ? { ...s, active: false } : s) } : prev
      );
    } catch {
      alert('No se pudo desactivar el colegio');
    }
  }

  async function handleDeleteSchool(school: School) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente el colegio "${school.name}"?\n\nSe eliminará toda su información, usuarios, estudiantes y pedidos.\nEsta acción NO se puede deshacer.`)) return;
    if (!confirm(`Confirma: eliminar "${school.name}" para siempre.`)) return;
    try {
      await apiClient.delete(`/schools/${school.id}/permanent`);
      setData((prev) => prev ? { ...prev, schools: prev.schools.filter((s) => s.id !== school.id), total: prev.total - 1 } : prev);
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo eliminar el colegio');
    }
  }

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div>
            <p className="dashboard-label">Administración</p>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: '-0.56px',
              }}
            >
              Colegios
            </h1>
          </div>
          <Link to="/schools/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
            + Nuevo colegio
          </Link>
        </div>

        {loading && (
          <div className="roadmap-note">Cargando colegios...</div>
        )}

        {error && (
          <p className="form-error">{error}</p>
        )}

        {!loading && !error && data && data.schools.length === 0 && (
          <div className="roadmap-note">
            No hay colegios registrados aún.{' '}
            <Link to="/schools/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>
              Crear el primero
            </Link>
          </div>
        )}

        {!loading && data && data.schools.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.schools.map((school) => (
              <div
                key={school.id}
                className="user-card"
                style={{ padding: '20px 24px', marginBottom: 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 600,
                          letterSpacing: '-0.34px',
                        }}
                      >
                        {school.name}
                      </h2>
                      <span className="role-badge" style={{ fontSize: 12 }}>
                        {PLAN_LABELS[school.plan]}
                      </span>
                      {!school.active && (
                        <span
                          className="role-badge"
                          style={{
                            background: 'rgba(212,86,86,0.1)',
                            color: 'var(--color-error)',
                          }}
                        >
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {school.city}
                      {school.nit && (
                        <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          NIT {school.nit}
                        </span>
                      )}
                    </p>
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontSize: 13,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {school._count.users} usuario{school._count.users !== 1 ? 's' : ''}
                      {' · '}
                      {school._count.students} estudiante{school._count.students !== 1 ? 's' : ''}
                      {' · '}
                      {school._count.stores} tienda{school._count.stores !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link to={`/schools/${school.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>Editar</Link>
                    {school.active && (
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-error)', borderColor: 'rgba(212,86,86,0.2)' }}
                        onClick={() => handleDeactivate(school.id, school.name)}>Desactivar</button>
                    )}
                    {isSuperAdmin && (
                      <button className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
                        onClick={() => handleDeleteSchool(school)} title="Eliminar permanentemente">🗑 Eliminar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.pages > 1 && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 13,
              color: 'var(--color-text-muted)',
            }}
          >
            Página {data.page} de {data.pages} · {data.total} colegios en total
          </p>
        )}
      </main>
    </>
  );
}
