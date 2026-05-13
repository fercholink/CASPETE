import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  country_code: string | null;
  role: 'PARENT' | 'VENDOR' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
  auth_provider: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  school: { id: string; name: string; city: string } | null;
  _count: { students: number; deliveries: number };
}
interface UsersResp { users: User[]; total: number; page: number; pages: number }
interface School { id: string; name: string; city: string }

const RL: Record<string, string> = { PARENT: 'Padre/Madre', VENDOR: 'Tendero', SCHOOL_ADMIN: 'Admin Colegio', SUPER_ADMIN: 'Super Admin' };
const RS: Record<string, { bg: string; color: string; icon: string }> = {
  PARENT:       { bg: 'var(--color-gray-100)', color: 'var(--color-text-muted)', icon: '👨‍👩‍👧' },
  VENDOR:       { bg: 'rgba(195,125,13,0.1)', color: '#c37d0d', icon: '🏪' },
  SCHOOL_ADMIN: { bg: 'var(--color-brand-light)', color: 'var(--color-brand-deep)', icon: '🎓' },
  SUPER_ADMIN:  { bg: 'rgba(55,114,207,0.1)', color: '#3772cf', icon: '🛡️' },
};

function initials(name: string) { return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); }
function timeAgo(d: string) { const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : days < 30 ? `Hace ${days}d` : `Hace ${Math.floor(days/30)}m`; }

const emptyForm = { full_name: '', email: '', password: '', phone: '', country_code: '+57', role: 'VENDOR' as 'VENDOR' | 'SCHOOL_ADMIN', school_id: '' };
const emptyEditForm = { full_name: '', phone: '', country_code: '+57', role: '' as string, school_id: '' };

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSA = user?.role === 'SUPER_ADMIN';

  const [data, setData] = useState<UsersResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [schools, setSchools] = useState<School[]>([]);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchUsers = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '50');
    if (search) p.set('search', search);
    if (roleFilter) p.set('role', roleFilter);
    if (activeFilter) p.set('active', activeFilter);
    apiClient.get<{ data: UsersResp }>(`/users?${p}`)
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, [search, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(page); }, [fetchUsers, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchUsers(1); }, 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    if (isSA) {
      apiClient.get<{ data: { schools?: School[]; data?: School[] } } | { data: School[] }>('/schools?active=true&limit=200')
        .then(r => {
          const raw = (r as any).data?.data;
          if (Array.isArray(raw)) setSchools(raw);
          else if (Array.isArray(raw?.schools)) setSchools(raw.schools);
        })
        .catch(() => {});
    }
  }, [isSA]);

  const stats = useMemo(() => {
    if (!data) return null;
    const u = data.users;
    return {
      total: data.total,
      parents: u.filter(x => x.role === 'PARENT').length,
      vendors: u.filter(x => x.role === 'VENDOR').length,
      admins: u.filter(x => x.role === 'SCHOOL_ADMIN' || x.role === 'SUPER_ADMIN').length,
    };
  }, [data]);

  async function handleToggle(t: User) {
    try {
      const r = await apiClient.patch<{ data: User }>(`/users/${t.id}`, { active: !t.active });
      setData(prev => prev ? { ...prev, users: prev.users.map(u => u.id === t.id ? r.data.data : u) } : prev);
    } catch (e) { alert((e as any).response?.data?.error ?? 'Error'); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateError('');
    try {
      const payload = {
        full_name: form.full_name, email: form.email, password: form.password, role: form.role,
        ...(form.phone ? { phone: form.phone.replace(/\s/g, '') } : {}),
        country_code: form.country_code,
        ...(isSA && form.school_id ? { school_id: form.school_id } : {}),
      };
      const r = await apiClient.post<{ data: User }>('/users', payload);
      setData(prev => prev ? { ...prev, users: [...prev.users, r.data.data], total: prev.total + 1 } : prev);
      setShowModal(false); setForm(emptyForm);
    } catch (err: unknown) {
      setCreateError((err as any).response?.data?.error ?? 'Error al crear usuario');
    } finally { setCreating(false); }
  }

  async function handleDelete(t: User) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente a "${t.full_name}" (${t.email})?\n\nEsta acción NO se puede deshacer.`)) return;
    try {
      await apiClient.delete(`/users/${t.id}/permanent`);
      setData(prev => prev ? { ...prev, users: prev.users.filter(u => u.id !== t.id), total: prev.total - 1 } : prev);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error desconocido';
      alert(`No se pudo eliminar: ${msg}`);
    }
  }

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({
      full_name: u.full_name,
      phone: u.phone ?? '',
      country_code: u.country_code ?? '+57',
      role: u.role,
      school_id: u.school?.id ?? '',
    });
    setEditError('');
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true); setEditError('');
    try {
      const payload: Record<string, unknown> = {
        full_name: editForm.full_name,
        phone: editForm.phone ? editForm.phone.replace(/\s/g, '') : null,
        country_code: editForm.country_code,
        role: editForm.role,
      };
      if (isSA && editForm.school_id) payload.school_id = editForm.school_id;
      const r = await apiClient.patch<{ data: User }>(`/users/${editTarget.id}`, payload);
      setData(prev => prev ? { ...prev, users: prev.users.map(u => u.id === editTarget.id ? r.data.data : u) } : prev);
      setEditTarget(null);
    } catch (err: unknown) {
      setEditError((err as any).response?.data?.error ?? 'Error al actualizar usuario');
    } finally { setEditing(false); }
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
            <p className="dashboard-label">Gestión</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Usuarios</h1>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setShowModal(true); setCreateError(''); setForm(emptyForm); }}>+ Nuevo usuario</button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
            {[
              { l: 'Total', v: stats.total, c: 'var(--color-text)', i: '👥' },
              { l: 'Padres', v: stats.parents, c: 'var(--color-text-muted)', i: '👨‍👩‍👧' },
              { l: 'Tenderos', v: stats.vendors, c: '#c37d0d', i: '🏪' },
              { l: 'Admins', v: stats.admins, c: '#3772cf', i: '🎓' },
            ].map(s => (
              <div key={s.l} className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.i} {s.l}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-placeholder)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre, email o teléfono..." style={{ paddingLeft: 36, marginBottom: 0 }} />
          </div>
          <select className="form-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 150, marginBottom: 0 }}>
            <option value="">Todos los roles</option>
            <option value="PARENT">👨‍👩‍👧 Padres</option>
            <option value="VENDOR">🏪 Tenderos</option>
            <option value="SCHOOL_ADMIN">🎓 Admin Colegio</option>
            {isSA && <option value="SUPER_ADMIN">🛡️ Super Admin</option>}
          </select>
          <select className="form-select" value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 120, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando usuarios...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && data && data.users.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 32 }}>👥</p>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>{search || roleFilter || activeFilter ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>{search ? 'Intenta con otros filtros' : 'Crea el primer usuario con el botón de arriba'}</p>
          </div>
        )}

        {!loading && data && data.users.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.users.map(u => {
              const role = RS[u.role];
              return (
                <div key={u.id} className="user-card" style={{ padding: '18px 24px', marginBottom: 0, opacity: u.active ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--color-border)' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: role.bg, color: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>
                          {initials(u.full_name)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>{u.full_name}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: role.bg, color: role.color, fontWeight: 500 }}>{role.icon} {RL[u.role]}</span>
                          {!u.active && <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>Inactivo</span>}
                          {u.auth_provider === 'google' && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 8, background: 'rgba(66,133,244,0.08)', color: '#4285f4' }}>Google</span>}
                        </div>
                        <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {u.email}
                          {u.phone && <span style={{ marginLeft: 10 }}>· {u.phone}</span>}
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                          {isSA && u.school && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>🏫 {u.school.name}</span>}
                          {u._count.students > 0 && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>🎒 {u._count.students} hijo{u._count.students !== 1 ? 's' : ''}</span>}
                          {u._count.deliveries > 0 && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📦 {u._count.deliveries} entrega{u._count.deliveries !== 1 ? 's' : ''}</span>}
                          <span style={{ fontSize: 11, color: 'var(--color-placeholder)', fontFamily: 'var(--font-mono)' }}>{timeAgo(u.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {u.id !== user?.id && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => openEdit(u)}>✏️ Editar</button>
                        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: u.active ? '#c37d0d' : 'var(--color-brand-deep)', borderColor: u.active ? 'rgba(195,125,13,0.2)' : 'rgba(0,128,0,0.2)' }} onClick={() => handleToggle(u)}>{u.active ? '⏸' : '▶'}</button>
                        {isSA && u.role !== 'SUPER_ADMIN' && (
                          <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }} onClick={() => handleDelete(u)}>🗑</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p-1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{data.page}/{data.pages}</span>
            <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p+1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
        {data && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--color-placeholder)' }}>{data.total} usuario{data.total !== 1 ? 's' : ''} en total</p>}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="user-card" style={{ maxWidth: 460, width: '100%', padding: '32px 28px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600 }}>Nuevo usuario</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>Crea una cuenta para un tendero o administrador de colegio</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-name">Nombre completo</label>
                <input id="new-name" className="form-input" type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required minLength={2} placeholder="Carlos Pérez" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-email">Email</label>
                <input id="new-email" className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="carlos@colegio.edu.co" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pwd">Contraseña inicial</label>
                <input id="new-pwd" className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} placeholder="Mín. 8 caracteres" autoComplete="new-password" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-role">Rol</label>
                  <select id="new-role" className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}>
                    <option value="VENDOR">🏪 Tendero</option>
                    <option value="SCHOOL_ADMIN">🎓 Admin Colegio</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-phone">Teléfono <span style={{ fontWeight: 400, color: 'var(--color-placeholder)' }}>(opc.)</span></label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', userSelect: 'none' }}>🇨🇴 +57</span>
                    <input id="new-phone" className="form-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="3001234567" style={{ flex: 1, marginBottom: 0 }} maxLength={10} />
                  </div>
                </div>
              </div>
              {isSA && (
                <div className="form-group">
                  <label className="form-label" htmlFor="new-school">Colegio</label>
                  <select id="new-school" className="form-select" value={form.school_id} onChange={e => setForm(p => ({ ...p, school_id: e.target.value }))} required>
                    <option value="">Selecciona un colegio</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                  </select>
                </div>
              )}
              {createError && <p className="form-error" style={{ marginTop: 12, marginBottom: 0 }}>{createError}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={creating}>{creating ? 'Creando...' : 'Crear usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Modal Editar usuario ──────────────────────────────── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setEditTarget(null); }}>
          <div className="user-card" style={{ maxWidth: 480, width: '100%', padding: '32px 28px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>✏️ Editar usuario</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>{editTarget.email}</p>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Nombre completo</label>
                <input id="edit-name" className="form-input" type="text" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} required minLength={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="edit-role">Rol</label>
                  <select id="edit-role" className="form-select" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="PARENT">👨‍👩‍👧 Padre/Madre</option>
                    <option value="VENDOR">🏪 Tendero</option>
                    <option value="SCHOOL_ADMIN">🎓 Admin Colegio</option>
                    {isSA && <option value="SUPER_ADMIN">🛡️ Super Admin</option>}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="edit-phone">Teléfono <span style={{ fontWeight: 400, color: 'var(--color-placeholder)' }}>(opc.)</span></label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', userSelect: 'none' }}>🇨🇴 +57</span>
                    <input id="edit-phone" className="form-input" type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="3001234567" style={{ flex: 1, marginBottom: 0 }} maxLength={10} />
                  </div>
                </div>
              </div>
              {isSA && (
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-school">Colegio asignado</label>
                  <select id="edit-school" className="form-select" value={editForm.school_id} onChange={e => setEditForm(p => ({ ...p, school_id: e.target.value }))}>
                    <option value="">Sin colegio asignado</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                  </select>
                </div>
              )}
              {editError && <p className="form-error" style={{ marginTop: 12, marginBottom: 0 }}>{editError}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditTarget(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={editing}>{editing ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
