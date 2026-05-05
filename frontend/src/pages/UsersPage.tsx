import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'PARENT' | 'VENDOR' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
  active: boolean;
  created_at: string;
  school: { id: string; name: string; city: string } | null;
}

interface School {
  id: string;
  name: string;
  city: string;
  active: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  PARENT: 'Padre/Madre', VENDOR: 'Tendero',
  SCHOOL_ADMIN: 'Admin Colegio', SUPER_ADMIN: 'Super Admin',
};
const ROLE_STYLE: Record<string, React.CSSProperties> = {
  PARENT:       { background: 'var(--color-gray-100)', color: 'var(--color-text-muted)' },
  VENDOR:       { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  SCHOOL_ADMIN: { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  SUPER_ADMIN:  { background: 'rgba(55,114,207,0.1)', color: '#3772cf' },
};

const emptyForm = { full_name: '', email: '', password: '', phone: '', role: 'VENDOR' as 'VENDOR' | 'SCHOOL_ADMIN', school_id: '' };

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal nuevo usuario
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    apiClient
      .get<{ data: User[] }>('/users')
      .then((r) => setUsers(r.data.data))
      .catch((e) => setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cargar usuarios'))
      .finally(() => setLoading(false));

    if (isSuperAdmin) {
      apiClient.get<{ data: School[] }>('/schools/active').then((r) => setSchools(r.data.data));
    }
  }, [isSuperAdmin]);

  async function handleToggle(target: User) {
    const action = target.active ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a "${target.full_name}"?`)) return;
    try {
      const r = await apiClient.patch<{ data: User }>(`/users/${target.id}`, { active: !target.active });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? r.data.data : u)));
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? `No se pudo ${action} el usuario`);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.phone ? { phone: form.phone } : {}),
        ...(isSuperAdmin && form.school_id ? { school_id: form.school_id } : {}),
      };
      const r = await apiClient.post<{ data: User }>('/users', payload);
      setUsers((prev) => [...prev, r.data.data]);
      setShowModal(false);
      setForm(emptyForm);
    } catch (err: unknown) {
      setCreateError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(target: User) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente a "${target.full_name}"?\n\nEsta acción NO se puede deshacer.`)) return;
    if (!confirm(`Confirma: vas a eliminar la cuenta de "${target.email}" para siempre.`)) return;
    try {
      await apiClient.delete(`/users/${target.id}/permanent`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo eliminar el usuario');
    }
  }


  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p className="dashboard-label">Gestión</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Usuarios</h1>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setShowModal(true); setCreateError(''); setForm(emptyForm); }}>
            + Nuevo usuario
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
          />
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 180, marginBottom: 0 }}
          >
            <option value="">Todos los roles</option>
            <option value="PARENT">Padre/Madre</option>
            <option value="VENDOR">Tendero</option>
            <option value="SCHOOL_ADMIN">Admin Colegio</option>
            {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando usuarios...</div>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && filtered.length === 0 && <div className="roadmap-note">No se encontraron usuarios.</div>}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((u) => (
              <div key={u.id} className="user-card" style={{ padding: '18px 24px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>{u.full_name}</span>
                      <span className="role-badge" style={{ ...ROLE_STYLE[u.role], fontSize: 11 }}>{ROLE_LABEL[u.role]}</span>
                      {!u.active && (
                        <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>Inactivo</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {u.email}{u.phone && <span style={{ marginLeft: 12 }}>{u.phone}</span>}
                    </p>
                    {isSuperAdmin && u.school && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{u.school.name} — {u.school.city}</p>
                    )}
                  </div>
                  {u.id !== user?.id && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn-ghost"
                        style={{
                          fontSize: 13, padding: '5px 14px',
                          color: u.active ? 'var(--color-error)' : 'var(--color-brand-deep)',
                          borderColor: u.active ? 'rgba(212,86,86,0.2)' : 'rgba(24,226,153,0.3)',
                        }}
                        onClick={() => handleToggle(u)}
                      >
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                      {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
                        <button
                          className="btn-ghost"
                          style={{
                            fontSize: 13, padding: '5px 14px',
                            color: '#dc2626',
                            borderColor: 'rgba(220,38,38,0.3)',
                            background: 'rgba(220,38,38,0.05)',
                          }}
                          onClick={() => handleDelete(u)}
                          title="Eliminar permanentemente"
                        >
                          🗑 Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            {filtered.length} de {users.length} usuarios
          </p>
        )}
      </main>

      {/* Modal nuevo usuario */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>Nuevo usuario</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-name">Nombre completo</label>
                <input id="new-name" className="form-input" type="text" value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required minLength={2} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-email">Email</label>
                <input id="new-email" className="form-input" type="email" value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pwd">Contraseña inicial</label>
                <input id="new-pwd" className="form-input" type="password" value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={8}
                  placeholder="Mín. 8 caracteres" autoComplete="new-password" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-role">Rol</label>
                  <select id="new-role" className="form-select" value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'VENDOR' | 'SCHOOL_ADMIN' }))}>
                    <option value="VENDOR">Tendero</option>
                    <option value="SCHOOL_ADMIN">Admin Colegio</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-phone">Teléfono <span style={{ fontWeight: 400, color: 'var(--color-placeholder)' }}>(opc.)</span></label>
                  <input id="new-phone" className="form-input" type="tel" value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+573001234567" />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="form-group">
                  <label className="form-label" htmlFor="new-school">Colegio al que pertenece</label>
                  <select id="new-school" className="form-select" value={form.school_id}
                    onChange={(e) => setForm((p) => ({ ...p, school_id: e.target.value }))} required>
                    <option value="">Selecciona un colegio</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.city}</option>
                    ))}
                  </select>
                </div>
              )}

              {createError && <p className="form-error" style={{ marginTop: 12, marginBottom: 0 }}>{createError}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={creating}>
                  {creating ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
