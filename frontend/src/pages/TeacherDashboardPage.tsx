import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function TeacherDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE ACADÉMICO</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>Mi perfil</button>
          <button className="btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Panel del Docente</p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Hola, {user?.full_name?.split(' ')[0]} 👩‍🏫</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
          <div className="user-card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate('/communications')}>
            <p style={{ margin: '0 0 6px', fontSize: 26 }}>📝</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Comunicaciones</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Avisos y excusas</p>
          </div>
        </div>

        <div className="user-card">
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Mis Cursos Asignados</p>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Aún no tienes cursos asignados para este periodo.</p>
          </div>
        </div>
      </main>
    </>
  );
}
