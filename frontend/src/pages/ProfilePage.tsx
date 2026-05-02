import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  PARENT: 'Padre / Madre de familia',
  VENDOR: 'Tendero',
  SCHOOL_ADMIN: 'Administrador de colegio',
  SUPER_ADMIN: 'Super Administrador',
};

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    setProfileError('');
    try {
      const r = await apiClient.patch<{ data: { full_name: string; phone: string | null } }>('/auth/profile', {
        full_name: fullName,
        phone: phone || null,
      });
      updateUser({ full_name: r.data.data.full_name });
      setProfileMsg('Perfil actualizado correctamente');
    } catch (err: unknown) {
      setProfileError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al actualizar');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setPwdError('Las contraseñas no coinciden'); return; }
    setPwdSaving(true);
    setPwdMsg('');
    setPwdError('');
    try {
      await apiClient.post('/auth/change-password', {
        current_password: currentPwd,
        new_password: newPwd,
      });
      setPwdMsg('Contraseña actualizada correctamente');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: unknown) {
      setPwdError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cambiar contraseña');
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Inicio
          </button>
          <button className="btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-body" style={{ maxWidth: 560 }}>
        <p className="dashboard-label">Cuenta</p>
        <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Mi perfil</h1>

        {/* Info de solo lectura */}
        <div className="user-card" style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--color-text-muted)' }}>Email</p>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontFamily: 'var(--font-mono)' }}>{user?.email}</p>
          <span className="role-badge">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
          {user?.school && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {user.school.name} — {user.school.city}
            </p>
          )}
        </div>

        {/* Formulario perfil */}
        <div className="user-card" style={{ marginBottom: 16 }}>
          <p className="dashboard-label" style={{ marginBottom: 16 }}>Información personal</p>
          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">Nombre completo</label>
              <input
                id="full_name" className="form-input" type="text"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                minLength={2} maxLength={200} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Teléfono <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional, +57XXXXXXXXXX)</span>
              </label>
              <input
                id="phone" className="form-input" type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+573001234567"
              />
            </div>
            {profileMsg && <p style={{ fontSize: 13, color: 'var(--color-brand-deep)', margin: '0 0 12px' }}>{profileMsg}</p>}
            {profileError && <p className="form-error" style={{ marginTop: 0, marginBottom: 12 }}>{profileError}</p>}
            <button type="submit" className="btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="user-card">
          <p className="dashboard-label" style={{ marginBottom: 16 }}>Cambiar contraseña</p>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="current_pwd">Contraseña actual</label>
              <input
                id="current_pwd" className="form-input" type="password"
                value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
                required autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new_pwd">Nueva contraseña</label>
              <input
                id="new_pwd" className="form-input" type="password"
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                minLength={8} required autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm_pwd">Confirmar nueva contraseña</label>
              <input
                id="confirm_pwd" className="form-input" type="password"
                value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                minLength={8} required autoComplete="new-password"
              />
            </div>
            {pwdMsg && <p style={{ fontSize: 13, color: 'var(--color-brand-deep)', margin: '0 0 12px' }}>{pwdMsg}</p>}
            {pwdError && <p className="form-error" style={{ marginTop: 0, marginBottom: 12 }}>{pwdError}</p>}
            <button type="submit" className="btn-primary" disabled={pwdSaving || newPwd.length < 8}>
              {pwdSaving ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
