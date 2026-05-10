import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School { id: string; name: string; city: string }

interface Student {
  id: string;
  full_name: string;
  national_id: string | null;
  grade: string | null;
  photo_url?: string | null;
  balance: string;
  active: boolean;
  created_at: string;
  school: School;
  parent: { id: string; full_name: string; email: string };
}

// Datos de pago de CASPETE — reemplaza con los datos reales de la empresa
const PAYMENT_INFO = {
  NEQUI: {
    label: 'Nequi',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    icon: '📱',
    fields: [
      { label: 'Número de celular', value: '310 000 0000' },
      { label: 'Nombre', value: 'CASPETE S.A.S.' },
    ],
  },
  BANCOLOMBIA: {
    label: 'Bancolombia',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    icon: '🏦',
    fields: [
      { label: 'Tipo de cuenta', value: 'Ahorros' },
      { label: 'Número de cuenta', value: '000-000000-00' },
      { label: 'Nombre', value: 'CASPETE S.A.S.' },
      { label: 'NIT', value: '000.000.000-0' },
    ],
  },
  DAVIVIENDA: {
    label: 'Davivienda',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    icon: '🏛️',
    fields: [
      { label: 'Tipo de cuenta', value: 'Ahorros' },
      { label: 'Número de cuenta', value: '0000000000000' },
      { label: 'Nombre', value: 'CASPETE S.A.S.' },
      { label: 'NIT', value: '000.000.000-0' },
    ],
  },
} as const;

type PaymentBank = keyof typeof PAYMENT_INFO;

interface Stats { total: number; active: number; inactive: number; totalBalance: string }

export default function StudentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Topup modal state (admin)
  const [topupStudentId, setTopupStudentId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');

  // Simulador de recarga para padres
  const [rechargeStudentId, setRechargeStudentId] = useState<string | null>(null);
  const [rechargeStep, setRechargeStep] = useState<1 | 2>(1);
  const [rechargeBank, setRechargeBank] = useState<PaymentBank | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeScreenshot, setRechargeScreenshot] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const isParent = user?.role === 'PARENT';
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchStudents = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '20');
    if (search) p.set('search', search);
    if (filterActive) p.set('active', filterActive);
    apiClient.get<{ data: { students: Student[]; total: number; page: number; pages: number } }>(`/students?${p}`)
      .then(r => { setStudents(r.data.data.students); setTotalPages(r.data.data.pages); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar estudiantes'))
      .finally(() => setLoading(false));
  }, [search, filterActive]);

  useEffect(() => { fetchStudents(page); }, [fetchStudents, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchStudents(1); }, 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (isAdmin) apiClient.get<{ data: Stats }>('/students/stats').then(r => setStats(r.data.data)).catch(() => {}); }, [isAdmin]);

  async function handleDeactivate(id: string) {
    try {
      await apiClient.delete(`/students/${id}`);
      fetchStudents(page);
    } catch { alert('No se pudo desactivar el estudiante'); }
  }

  async function handleReactivate(id: string) {
    try {
      await apiClient.patch(`/students/${id}/reactivate`);
      fetchStudents(page);
    } catch { alert('No se pudo reactivar el estudiante'); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/students/${deleteTarget.id}/permanent`);
      setDeleteTarget(null);
      fetchStudents(page);
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e?.response?.data?.error ?? e?.message ?? 'Error'}`);
    } finally { setDeleteLoading(false); }
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

  function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject('Error al cargar la imagen');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Error al leer el archivo');
      reader.readAsDataURL(file);
    });
  }

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, 800, 800);
      setRechargeScreenshot(base64);
    } catch (err) {
      alert('Error al procesar la imagen del comprobante');
    }
  }

  async function handleSubmitTopupRequest() {
    if (!rechargeStudentId || !rechargeAmount || !rechargeScreenshot) return;
    setRechargeLoading(true);
    try {
      await apiClient.post('/topup-requests', {
        studentId: rechargeStudentId,
        amount: Number(rechargeAmount),
        receiptUrl: rechargeScreenshot,
      });
      alert('¡Comprobante enviado! El colegio validará el pago pronto.');
      setRechargeStudentId(null);
    } catch (err) {
      alert((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al enviar comprobante');
    } finally {
      setRechargeLoading(false);
    }
  }

  const title = isParent ? 'Mis hijos' : 'Estudiantes';
  const topupStudent = students.find((s) => s.id === topupStudentId);

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

        {/* Stats cards (admin only) */}
        {isAdmin && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total', value: stats.total, icon: '🎒', color: '#2563eb' },
              { label: 'Activos', value: stats.active, icon: '✅', color: '#059669' },
              { label: 'Inactivos', value: stats.inactive, icon: '⏸', color: '#dc2626' },
              { label: 'Saldo total', value: `$${parseFloat(stats.totalBalance).toLocaleString('es-CO')}`, icon: '💰', color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} className="user-card" style={{ padding: '14px 16px', marginBottom: 0, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 22 }}>{s.icon}</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter bar */}
        {(isAdmin || students.length > 5) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="form-input" placeholder="Buscar estudiante, documento o padre..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }} />
            </div>
            {isAdmin && (
              <select className="form-select" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }} style={{ width: 150, marginBottom: 0 }}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            )}
            {(search || filterActive) && (
              <button className="btn-ghost" style={{ fontSize: 13, padding: '7px 12px', color: 'var(--color-text-muted)' }} onClick={() => { setSearch(''); setFilterActive(''); setPage(1); }}>Limpiar ×</button>
            )}
          </div>
        )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url} 
                        alt="" 
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
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
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isParent && student.active && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                        onClick={() => {
                          setRechargeStudentId(student.id);
                          setRechargeStep(1);
                          setRechargeBank(null);
                          setRechargeAmount('');
                          setRechargeScreenshot('');
                        }}
                      >
                        + Recargar
                      </button>
                    )}
                    {isAdmin && student.active && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                        onClick={() => { setTopupStudentId(student.id); setTopupAmount(''); setTopupError(''); }}
                      >
                        + Recargar (admin)
                      </button>
                    )}
                    <Link to={`/students/${student.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>
                      ✏️
                    </Link>
                    {student.active ? (
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: '#c37d0d' }} onClick={() => handleDeactivate(student.id)}>⏸</button>
                    ) : (
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: '#059669' }} onClick={() => handleReactivate(student.id)}>▶</button>
                    )}
                    {isSuperAdmin && (
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', color: '#dc2626' }} onClick={() => setDeleteTarget(student)}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{page} / {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>¿Eliminar estudiante?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Se eliminará <strong>"{deleteTarget.full_name}"</strong> junto con todos sus pedidos, transacciones e historial.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>Esta acción NO se puede deshacer.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={deleteLoading} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button style={{ flex: 1, padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }} disabled={deleteLoading} onClick={confirmDelete}>
                {deleteLoading ? 'Eliminando...' : '🗑 Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal simulador de recarga para padres */}
      {rechargeStudentId && (() => {
        const rechargeStudent = students.find((s) => s.id === rechargeStudentId);
        if (!rechargeStudent) return null;
        const bankInfo = rechargeBank ? PAYMENT_INFO[rechargeBank] : null;

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
            onClick={(e) => { if (e.target === e.currentTarget) setRechargeStudentId(null); }}
          >
            <div className="user-card" style={{ maxWidth: 460, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>Recargar saldo</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {rechargeStudent.full_name} · Saldo actual: <strong>${parseFloat(rechargeStudent.balance).toLocaleString('es-CO')}</strong>
                  </p>
                </div>
                <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={() => setRechargeStudentId(null)}>×</button>
              </div>

              {/* Indicador de pasos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                {[1, 2].map((step) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: rechargeStep >= step ? 'var(--color-brand-deep)' : 'var(--color-gray-100)',
                      color: rechargeStep >= step ? '#fff' : 'var(--color-text-muted)',
                    }}>
                      {step}
                    </div>
                    <span style={{ fontSize: 13, color: rechargeStep >= step ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {step === 1 ? 'Elige tu banco' : 'Datos de pago'}
                    </span>
                    {step < 2 && <div style={{ width: 24, height: 1, background: 'var(--color-gray-200)' }} />}
                  </div>
                ))}
              </div>

              {/* Paso 1: Selección de banco */}
              {rechargeStep === 1 && (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>¿Cómo vas a realizar la transferencia?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(Object.keys(PAYMENT_INFO) as PaymentBank[]).map((bank) => {
                      const info = PAYMENT_INFO[bank];
                      return (
                        <button
                          key={bank}
                          onClick={() => { setRechargeBank(bank); setRechargeStep(2); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '16px 20px', border: `1.5px solid ${info.color}30`,
                            borderRadius: 10, background: info.bg, cursor: 'pointer',
                            textAlign: 'left', transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 28 }}>{info.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: info.color }}>{info.label}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Transferencia bancaria</p>
                          </div>
                          <svg style={{ marginLeft: 'auto', color: info.color }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      );
                    })}
                  </div>
                  <button className="btn-ghost" style={{ marginTop: 16, width: '100%' }} onClick={() => setRechargeStudentId(null)}>
                    Cancelar
                  </button>
                </div>
              )}

              {/* Paso 2: Datos de pago */}
              {rechargeStep === 2 && bankInfo && (
                <div>
                  {/* Datos de la cuenta */}
                  <div style={{ background: bankInfo.bg, border: `1.5px solid ${bankInfo.color}25`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{bankInfo.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: bankInfo.color }}>{bankInfo.label}</span>
                    </div>
                    {bankInfo.fields.map((field: { label: string; value: string }) => (
                      <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{field.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{field.value}</span>
                          <button
                            title="Copiar"
                            onClick={() => navigator.clipboard.writeText(field.value)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 12, color: bankInfo.color }}
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Instrucción QR */}
                  <div className="roadmap-note" style={{ marginBottom: 20, fontSize: 13 }}>
                    💡 Abre tu app de <strong>{bankInfo.label}</strong>, escanea el código QR o transfiere al número/cuenta indicados arriba.
                  </div>

                  {/* Monto */}
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="recharge-amount">¿Cuánto vas a transferir? (COP)</label>
                    <input
                      id="recharge-amount"
                      className="form-input"
                      type="number"
                      min="1000"
                      max="10000000"
                      step="1000"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="20000"
                    />
                  </div>

                  {/* Comprobante */}
                  <div style={{ background: 'rgba(24,226,153,0.06)', border: '1.5px solid rgba(24,226,153,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)' }}>
                      📩 Después de hacer la transferencia, <strong>carga aquí el comprobante (pantallazo)</strong>.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="form-input"
                      style={{ padding: '8px', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}
                    />
                    {rechargeScreenshot && (
                      <img 
                        src={rechargeScreenshot} 
                        alt="Comprobante" 
                        style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--color-border)' }} 
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={handleSubmitTopupRequest}
                      disabled={!rechargeAmount || !rechargeScreenshot || rechargeLoading}
                      className="btn-primary"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      {rechargeLoading ? 'Enviando...' : '📤 Enviar comprobante para validación'}
                    </button>
                    <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setRechargeStep(1)}>
                      ← Cambiar banco
                    </button>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12, marginBottom: 0 }}>
                    Tu saldo se activará en un plazo de 1 a 24 horas hábiles.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal recarga de saldo (admin) */}
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
