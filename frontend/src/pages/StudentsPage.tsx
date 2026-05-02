import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School { id: string; name: string; city: string }

interface Student {
  id: string;
  full_name: string;
  national_id: string | null;
  grade: string | null;
  balance: string;
  active: boolean;
  created_at: string;
  school: School;
  parent: { id: string; full_name: string; email: string };
}

export default function StudentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Topup modal state
  const [topupStudentId, setTopupStudentId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');

  const isParent = user?.role === 'PARENT';
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    apiClient
      .get<{ data: Student[] }>('/students')
      .then((res) => setStudents(res.data.data))
      .catch((err) => {
        setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cargar estudiantes');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`¿Desactivar a "${name}"?`)) return;
    try {
      await apiClient.delete(`/students/${id}`);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, active: false } : s)));
    } catch {
      alert('No se pudo desactivar el estudiante');
    }
  }

  async function handleDeleteStudent(student: Student) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente a "${student.full_name}"?\n\nSe eliminarán también sus órdenes, transacciones e historial.\nEsta acción NO se puede deshacer.`)) return;
    if (!confirm(`Confirma: eliminar a "${student.full_name}" del sistema para siempre.`)) return;
    try {
      await apiClient.delete(`/students/${student.id}/permanent`);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo eliminar el estudiante');
    }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!topupStudentId) return;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) { setTopupError('Ingresa un monto válido'); return; }
    setTopupLoading(true);
    setTopupError('');
    try {
      const r = await apiClient.post<{ data: Student }>(`/students/${topupStudentId}/topup`, { amount });
      setStudents((prev) => prev.map((s) => (s.id === topupStudentId ? { ...s, balance: r.data.data.balance } : s)));
      setTopupStudentId(null);
      setTopupAmount('');
    } catch (err: unknown) {
      setTopupError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al recargar');
    } finally {
      setTopupLoading(false);
    }
  }

  const title = isParent ? 'Mis hijos' : 'Estudiantes';
  const topupStudent = students.find((s) => s.id === topupStudentId);

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
            <p className="dashboard-label">{isParent ? 'Mi familia' : 'Gestión'}</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>{title}</h1>
          </div>
          {isParent && (
            <Link to="/students/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
              + Agregar hijo
            </Link>
          )}
        </div>

        {loading && <div className="roadmap-note">Cargando estudiantes...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && students.length === 0 && (
          <div className="roadmap-note">
            {isParent ? (
              <>Aún no has registrado hijos.{' '}
                <Link to="/students/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Agregar ahora</Link>
              </>
            ) : 'No hay estudiantes registrados.'}
          </div>
        )}

        {!loading && students.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.map((student) => (
              <div key={student.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.34px' }}>{student.full_name}</h2>
                      {student.grade && <span className="role-badge" style={{ fontSize: 12 }}>{student.grade}</span>}
                      {!student.active && (
                        <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)' }}>Inactivo</span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
                      {student.school.name} — {student.school.city}
                      {student.national_id && (
                        <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>Doc. {student.national_id}</span>
                      )}
                    </p>

                    {!isParent && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Padre/Madre: {student.parent.full_name}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-brand-deep)', fontFamily: 'var(--font-mono)' }}>
                        Saldo: ${parseFloat(student.balance).toLocaleString('es-CO')}
                      </p>
                      <Link
                        to={`/transactions?student_id=${student.id}`}
                        style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}
                      >
                        Ver historial →
                      </Link>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isAdmin && student.active && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                        onClick={() => { setTopupStudentId(student.id); setTopupAmount(''); setTopupError(''); }}
                      >
                        + Recargar
                      </button>
                    )}
                    <Link to={`/students/${student.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>
                      Editar
                    </Link>
                    {student.active && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-error)', borderColor: 'rgba(212,86,86,0.2)' }}
                        onClick={() => handleDeactivate(student.id, student.full_name)}
                      >
                        Desactivar
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        className="btn-ghost"
                        style={{
                          fontSize: 13, padding: '5px 14px',
                          color: '#dc2626',
                          borderColor: 'rgba(220,38,38,0.3)',
                          background: 'rgba(220,38,38,0.05)',
                        }}
                        onClick={() => handleDeleteStudent(student)}
                        title="Eliminar permanentemente (solo Super Admin)"
                      >
                        🗑 Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal recarga de saldo */}
      {topupStudentId && topupStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setTopupStudentId(null); }}
        >
          <div className="user-card" style={{ maxWidth: 400, width: '100%', padding: '32px 28px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>
              Recargar saldo
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              {topupStudent.full_name} · Saldo actual: <strong>${parseFloat(topupStudent.balance).toLocaleString('es-CO')}</strong>
            </p>

            <form onSubmit={handleTopup}>
              <div className="form-group">
                <label className="form-label" htmlFor="amount">Monto a recargar (COP)</label>
                <input
                  id="amount" className="form-input" type="number"
                  min="500" max="500000" step="500"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="10000"
                  autoFocus
                />
              </div>

              {topupError && <p className="form-error" style={{ marginTop: 0, marginBottom: 12 }}>{topupError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setTopupStudentId(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={topupLoading}>
                  {topupLoading ? 'Recargando...' : 'Recargar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
