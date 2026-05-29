import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function StudentGradesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <span className="nav-logo-dot" />CASPETE
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>Mi perfil</button>
          <button className="btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Calificaciones 📊</h1>
        </div>

        <div className="user-card">
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Boletín Actual</p>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Las calificaciones de este periodo aún no han sido publicadas por el docente.</p>
          </div>
        </div>
      </main>
    </>
  );
}
