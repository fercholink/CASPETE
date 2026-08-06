import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCodeLib from 'react-qr-code';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const QRCode = (QRCodeLib as any).default || QRCodeLib;

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

// Datos de pago de KIDWAY — ahora se cargan dinámicamente desde la API
interface PaymentMethodField { label: string; value: string }
interface PaymentMethodInfo {
  id: string; key: string; label: string; icon: string; color: string;
  fields: PaymentMethodField[]; active: boolean; sort_order: number;
}


interface Stats { total: number; active: number; inactive: number; totalBalance: string }

interface TrackerData {
  id: string;
  qr_token: string;
  device_name: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  online: boolean;
  last_seen_at: string | null;
  extended_tracking_until: string | null;
  active: boolean;
  sos_number: string | null;
  dad_number: string | null;
  mom_number: string | null;
}

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
  const [rechargeBank, setRechargeBank] = useState<PaymentMethodInfo | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeScreenshot, setRechargeScreenshot] = useState('');
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);

  // Localizador GPS
  const [gpsStudentId, setGpsStudentId] = useState<string | null>(null);
  const [gpsTracker, setGpsTracker] = useState<TrackerData | null>(null);
  const [gpsNotLinked, setGpsNotLinked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [imei, setImei] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [findingDevice, setFindingDevice] = useState(false);
  const [deviceSounding, setDeviceSounding] = useState(false);
  const [findError, setFindError] = useState('');
  const [poweringOff, setPoweringOff] = useState(false);
  const [powerError, setPowerError] = useState('');
  const [alarmWeekdays, setAlarmWeekdays] = useState(0); // bitmask, bit0=lunes...bit6=domingo
  const [alarmTime, setAlarmTime] = useState('');
  const [savingAlarm, setSavingAlarm] = useState(false);
  const [alarmSaved, setAlarmSaved] = useState(false);
  const [alarmError, setAlarmError] = useState('');

  // Números de contacto (SOS/papá/mamá) — el dispositivo llama a estos al presionar su botón físico de SOS
  const [sosNumber, setSosNumber] = useState('');
  const [dadNumber, setDadNumber] = useState('');
  const [momNumber, setMomNumber] = useState('');
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactsSaved, setContactsSaved] = useState(false);

  const isParent = user?.role === 'PARENT';
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  const fetchStudents = useCallback((pg = 1) => {
    if (isSchoolAdmin) { setLoading(false); return; }
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '20');
    if (search) p.set('search', search);
    if (filterActive) p.set('active', filterActive);
    apiClient.get<{ data: { students: Student[]; total: number; page: number; pages: number } }>(`/students?${p}`)
      .then(r => { setStudents(r.data.data.students); setTotalPages(r.data.data.pages); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar estudiantes'))
      .finally(() => setLoading(false));
  }, [search, filterActive, isSchoolAdmin]);

  useEffect(() => { fetchStudents(page); }, [fetchStudents, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchStudents(1); }, 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (isAdmin) apiClient.get<{ data: Stats }>('/students/stats').then(r => setStats(r.data.data)).catch(() => {}); }, [isAdmin]);

  // Cargar métodos de pago dinámicamente
  useEffect(() => {
    if (isParent) apiClient.get<{ data: PaymentMethodInfo[] }>('/payment-methods').then(r => setPaymentMethods(r.data.data)).catch(() => {});
  }, [isParent]);

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
    if (!rechargeStudentId || !rechargeAmount) return;
    if (!rechargeScreenshot && !rechargeRef.trim()) {
      alert('Debes subir el comprobante o ingresar el número de referencia');
      return;
    }
    setRechargeLoading(true);
    try {
      await apiClient.post('/topup-requests', {
        studentId: rechargeStudentId,
        amount: Number(rechargeAmount),
        receiptUrl: rechargeScreenshot,
        paymentReference: rechargeRef.trim() || undefined,
      });
      alert('¡Solicitud enviada! El colegio validará el pago pronto.');
      setRechargeStudentId(null);
    } catch (err) {
      alert((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al enviar comprobante');
    } finally {
      setRechargeLoading(false);
    }
  }

  function openGpsModal(studentId: string) {
    setGpsStudentId(studentId);
    setGpsTracker(null);
    setGpsNotLinked(false);
    setGpsError('');
    setImei('');
    setDeviceName('');
    setSosNumber(''); setDadNumber(''); setMomNumber('');
    setContactsError(''); setContactsSaved(false);
    setDeviceSounding(false); setFindError('');
    setPowerError('');
    setAlarmWeekdays(0); setAlarmTime(''); setAlarmError(''); setAlarmSaved(false);
    setGpsLoading(true);
    apiClient.get<{ data: { tracker: TrackerData } }>(`/gps/trackers/student/${studentId}`)
      .then((r) => {
        const tracker = r.data.data.tracker;
        setGpsTracker(tracker);
        setSosNumber(tracker.sos_number ?? '');
        setDadNumber(tracker.dad_number ?? '');
        setMomNumber(tracker.mom_number ?? '');
      })
      .catch((err) => {
        if ((err as { response?: { status?: number } }).response?.status === 404) setGpsNotLinked(true);
        else setGpsError('No se pudo consultar el localizador');
      })
      .finally(() => setGpsLoading(false));
  }

  async function handleLinkTracker(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsStudentId) return;
    if (imei.length !== 15) { setGpsError('El IMEI debe tener 15 dígitos'); return; }
    setLinking(true);
    setGpsError('');
    try {
      const r = await apiClient.post<{ data: TrackerData }>('/gps/trackers', {
        student_id: gpsStudentId,
        imei,
        device_name: deviceName || undefined,
      });
      setGpsTracker(r.data.data);
      setGpsNotLinked(false);
    } catch (err) {
      setGpsError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al vincular el localizador');
    } finally {
      setLinking(false);
    }
  }

  async function handleSaveContacts(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker) return;
    setSavingContacts(true);
    setContactsError('');
    setContactsSaved(false);
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/emergency-contacts`, {
        ...(sosNumber ? { sos_number: sosNumber } : {}),
        ...(dadNumber ? { dad_number: dadNumber } : {}),
        ...(momNumber ? { mom_number: momNumber } : {}),
      });
      setContactsSaved(true);
    } catch (err) {
      setContactsError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar los números de contacto');
    } finally {
      setSavingContacts(false);
    }
  }

  async function handleFindDevice() {
    if (!gpsTracker) return;
    const nextActive = !deviceSounding;
    setFindingDevice(true);
    setFindError('');
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/find`, { active: nextActive });
      setDeviceSounding(nextActive);
    } catch (err) {
      setFindError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo contactar a la tarjeta');
    } finally {
      setFindingDevice(false);
    }
  }

  async function handlePowerOff() {
    if (!gpsTracker) return;
    if (!confirm('¿Apagar la tarjeta? No hay forma de volver a encenderla desde la app — habrá que presionar su botón físico o conectarla al cargador.')) return;
    setPoweringOff(true);
    setPowerError('');
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/power`, { action: 'shutdown' });
    } catch (err) {
      setPowerError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo apagar la tarjeta');
    } finally {
      setPoweringOff(false);
    }
  }

  function toggleAlarmWeekday(bit: number) {
    setAlarmWeekdays((prev) => (prev & (1 << bit) ? prev & ~(1 << bit) : prev | (1 << bit)));
  }

  async function handleSaveAlarm(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker || !alarmTime) return;
    const [hour, minute] = alarmTime.split(':').map(Number);
    setSavingAlarm(true);
    setAlarmError('');
    setAlarmSaved(false);
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/alarm-clock`, {
        alarms: [{ weekdays: alarmWeekdays, hour, minute }],
      });
      setAlarmSaved(true);
    } catch (err) {
      setAlarmError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo guardar la alarma');
    } finally {
      setSavingAlarm(false);
    }
  }

  async function handleUnlinkTracker() {
    if (!gpsTracker) return;
    if (!confirm('¿Desvincular este localizador? El estudiante dejará de ser rastreado hasta que vincules uno nuevo.')) return;
    setUnlinking(true);
    try {
      await apiClient.delete(`/gps/trackers/${gpsTracker.id}`);
      setGpsTracker(null);
      setGpsNotLinked(true);
    } catch {
      alert('No se pudo desvincular el localizador');
    } finally {
      setUnlinking(false);
    }
  }

  const title = isParent ? 'Mis hijos' : 'Estudiantes';
  const topupStudent = students.find((s) => s.id === topupStudentId);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />KIDWAY</span>
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
        {!isSchoolAdmin && (isAdmin || students.length > 5) && (
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

        {!isSchoolAdmin && !loading && !error && students.length === 0 && (
          <div className="roadmap-note">
            {isParent ? (
              <>Aún no has registrado hijos.{' '}
                <Link to="/students/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Agregar ahora</Link>
              </>
            ) : 'No hay estudiantes registrados.'}
          </div>
        )}

        {!isSchoolAdmin && !loading && students.length > 0 && (
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
                          setRechargeRef('');
                        }}
                      >
                        + Recargar
                      </button>
                    )}
                    {isParent && student.active && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px' }}
                        onClick={() => openGpsModal(student.id)}
                      >
                        📍 GPS
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
        {!isSchoolAdmin && totalPages > 1 && (
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
        const bankInfo = rechargeBank;

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

              {/* Paso 1: Selección de método de pago */}
              {rechargeStep === 1 && (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>¿Cómo quieres recargar?</p>

                  {/* Sección: Transferencia manual */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏦 Transferencia manual</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.key}
                        onClick={() => { setRechargeBank(pm); setRechargeStep(2); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px', border: `1.5px solid ${pm.color}30`,
                          borderRadius: 10, background: `${pm.color}08`, cursor: 'pointer',
                          textAlign: 'left', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{pm.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: pm.color }}>{pm.label}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>Transferencia bancaria</p>
                        </div>
                        <svg style={{ marginLeft: 'auto', color: pm.color }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                      </button>
                    ))}
                  </div>

                  {/* Sección: Nequi Push */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📱 Pago instantáneo</p>
                  <button
                    disabled
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                      padding: '14px 18px', border: '1.5px solid rgba(139,92,246,0.25)',
                      borderRadius: 10, background: 'rgba(139,92,246,0.06)', cursor: 'not-allowed',
                      textAlign: 'left', transition: 'all 0.15s', opacity: 0.7,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>📱</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#8B5CF6' }}>Nequi Push</p>
                        <span style={{ fontSize: 9, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>PRÓXIMAMENTE</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>Paga desde tu app Nequi — confirmación automática</p>
                    </div>
                  </button>

                  <button className="btn-ghost" style={{ marginTop: 16, width: '100%' }} onClick={() => setRechargeStudentId(null)}>
                    Cancelar
                  </button>
                </div>
              )}

              {/* Paso 2: Datos de pago */}
              {rechargeStep === 2 && bankInfo && (
                <div>
                  {/* Datos de la cuenta */}
                  <div style={{ background: `${bankInfo.color}08`, border: `1.5px solid ${bankInfo.color}25`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
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

                  {/* Referencia de pago */}
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="recharge-ref">
                      Número de referencia / aprobación
                    </label>
                    <input
                      id="recharge-ref"
                      className="form-input"
                      type="text"
                      value={rechargeRef}
                      onChange={(e) => setRechargeRef(e.target.value)}
                      placeholder="Ej: 1234567890"
                      style={{ marginBottom: 0 }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Número que aparece en el mensaje de confirmación de tu banco.
                    </p>
                  </div>

                  {/* Comprobante */}
                  <div style={{ background: 'rgba(24,226,153,0.06)', border: '1.5px solid rgba(24,226,153,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)' }}>
                      📩 Opcional: también puedes <strong>cargar el comprobante (pantallazo)</strong>.
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
                      disabled={!rechargeAmount || (!rechargeScreenshot && !rechargeRef.trim()) || rechargeLoading}
                      className="btn-primary"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      {rechargeLoading ? 'Enviando...' : '📤 Enviar solicitud de recarga'}
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

      {/* Modal localizador GPS */}
      {gpsStudentId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setGpsStudentId(null); }}
        >
          <div className="user-card" style={{ maxWidth: 420, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>📍 Localizador GPS</h2>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={() => setGpsStudentId(null)}>×</button>
            </div>

            {gpsLoading && <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Consultando...</p>}
            {gpsError && <p className="form-error" style={{ marginTop: 0 }}>{gpsError}</p>}

            {/* Ya tiene un localizador vinculado */}
            {gpsTracker && !gpsLoading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                    <QRCode value={`KIDWAY:CARD:${gpsTracker.qr_token}`} size={160} />
                  </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Este es el código que va impreso en la tarjeta del estudiante — el colegio lo usa para asistencia y el tendero para identificarlo en la entrega.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Dispositivo</span>
                    <span style={{ fontWeight: 600 }}>{gpsTracker.device_name ?? 'Sin nombre'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Estado</span>
                    <span style={{ fontWeight: 600, color: gpsTracker.online ? '#059669' : 'var(--color-text-muted)' }}>
                      {gpsTracker.online ? '🟢 En línea' : '⚪ Sin conexión'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Batería</span>
                    <span style={{ fontWeight: 600 }}>{gpsTracker.battery_level ?? '—'}%</span>
                  </div>
                </div>

                <button
                  className="btn-ghost"
                  style={{ width: '100%', marginBottom: 10 }}
                  disabled={findingDevice || !gpsTracker.online}
                  onClick={handleFindDevice}
                >
                  {findingDevice ? 'Enviando...' : deviceSounding ? '🔇 Detener sonido' : '🔊 Buscar tarjeta (hacerla sonar)'}
                </button>
                {!gpsTracker.online && (
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-placeholder)', textAlign: 'center' }}>
                    La tarjeta debe estar en línea para poder encontrarla.
                  </p>
                )}
                {findError && <p className="form-error" style={{ marginTop: 0, marginBottom: 10, textAlign: 'center' }}>{findError}</p>}

                <Link to="/tracking" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block', marginBottom: 20 }}>
                  Ver ubicación en el mapa
                </Link>

                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Botón de SOS de la tarjeta</p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
                  Al presionar el botón físico de la tarjeta, marca al Número 1. Si no contesta, puedes agregar un segundo y tercer número de respaldo.
                </p>
                <form onSubmit={handleSaveContacts} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  <input className="form-input" type="tel" placeholder="Número 1 (SOS)" value={sosNumber} onChange={(e) => setSosNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  <input className="form-input" type="tel" placeholder="Número 2" value={dadNumber} onChange={(e) => setDadNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  <input className="form-input" type="tel" placeholder="Número 3" value={momNumber} onChange={(e) => setMomNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  {contactsError && <p className="form-error" style={{ margin: 0 }}>{contactsError}</p>}
                  {contactsSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Números guardados ✓</p>}
                  <button type="submit" className="btn-ghost" disabled={savingContacts || (!sosNumber && !dadNumber && !momNumber)}>
                    {savingContacts ? 'Guardando...' : 'Guardar números de contacto'}
                  </button>
                </form>

                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Alarma de despertador</p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
                  Si la tarjeta tiene parlante, suena a la hora que elijas los días marcados.
                </p>
                <form onSubmit={handleSaveAlarm} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, bit) => (
                      <button
                        key={bit}
                        type="button"
                        onClick={() => toggleAlarmWeekday(bit)}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${alarmWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'var(--color-border)'}`,
                          background: alarmWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'transparent',
                          color: alarmWeekdays & (1 << bit) ? '#fff' : 'var(--color-text-muted)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input className="form-input" type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
                  {alarmError && <p className="form-error" style={{ margin: 0 }}>{alarmError}</p>}
                  {alarmSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Alarma guardada ✓</p>}
                  <button type="submit" className="btn-ghost" disabled={savingAlarm || !alarmTime || alarmWeekdays === 0}>
                    {savingAlarm ? 'Guardando...' : 'Guardar alarma'}
                  </button>
                </form>

                <button className="btn-ghost" style={{ width: '100%', color: '#dc2626', marginBottom: 10 }} disabled={poweringOff || !gpsTracker.online} onClick={handlePowerOff}>
                  {poweringOff ? 'Apagando...' : '⏻ Apagar tarjeta'}
                </button>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-placeholder)', textAlign: 'center' }}>
                  No se puede volver a encender desde la app — solo con el botón físico o el cargador.
                </p>
                {powerError && <p className="form-error" style={{ marginTop: 0, marginBottom: 10, textAlign: 'center' }}>{powerError}</p>}

                <button className="btn-ghost" style={{ width: '100%', color: '#dc2626' }} disabled={unlinking} onClick={handleUnlinkTracker}>
                  {unlinking ? 'Desvinculando...' : 'Desvincular localizador'}
                </button>
              </div>
            )}

            {/* Sin localizador — formulario de vinculación */}
            {gpsNotLinked && !gpsLoading && (
              <form onSubmit={handleLinkTracker}>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Ingresa los datos de la tarjeta localizadora que compraste. El rastreo solo funciona durante el horario escolar del colegio.
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="imei">IMEI (15 dígitos)</label>
                  <input
                    id="imei" className="form-input" value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="123456789012345" autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="device-name">Nombre (opcional)</label>
                  <input
                    id="device-name" className="form-input" value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Ej: Mochila de Sofía" style={{ marginBottom: 0 }}
                  />
                </div>

                {gpsError && <p className="form-error">{gpsError}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setGpsStudentId(null)}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={linking}>
                    {linking ? 'Vinculando...' : 'Vincular'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
