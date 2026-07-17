import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface DayRow {
  date: string;
  meals_delivered: number;
  attendance_count: number;
}

interface AuditReport {
  school: { id: string; name: string; meal_payment_model: 'PER_ORDER' | 'INCLUDED'; cost_per_meal: number | null };
  enrolled_students: number;
  total_meals_delivered: number;
  avg_meals_per_day: number;
  estimated_cost: number | null;
  has_attendance_data: boolean;
  days: DayRow[];
}

interface SchoolOption {
  id: string;
  name: string;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmt(n: number) {
  return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}
function fmtDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()}`;
}
function isWeekend(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0 || d.getDay() === 6;
}

function DayBar({ date, meals, attendance, max, hasAttendance }: { date: string; meals: number; attendance: number; max: number; hasAttendance: boolean }) {
  const pct = max > 0 ? Math.min(100, (meals / max) * 100) : 0;
  const attPct = hasAttendance && max > 0 ? Math.min(100, (attendance / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 46, flexShrink: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDateLabel(date)}</span>
      <div style={{ flex: 1, height: 14, background: 'var(--color-gray-100)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-brand)', borderRadius: 99, transition: 'width 0.5s ease' }} />
        {hasAttendance && (
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${attPct}%`, borderRight: '2px solid #3772cf' }} />
        )}
      </div>
      <span style={{ width: 68, flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        {meals} comida{meals !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function PensionAuditPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState<string>(user?.school_id ?? '');
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      apiClient.get<{ data: SchoolOption[] }>('/schools/active')
        .then((r) => setSchoolOptions(r.data.data))
        .catch(() => {});
    }
  }, [user]);

  const fetchReport = useCallback(() => {
    if (!schoolId) { setReport(null); setLoading(false); return; }
    setLoading(true);
    apiClient.get<{ data: AuditReport }>(`/reports/pension-audit?school_id=${schoolId}&month=${month}&year=${year}`)
      .then((r) => { setReport(r.data.data); setError(''); })
      .catch((e) => setError((e as any).response?.data?.error ?? 'Error al cargar el reporte de auditoría'))
      .finally(() => setLoading(false));
  }, [schoolId, month, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; } else if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  }

  const visibleDays = useMemo(() => {
    if (!report) return [];
    return report.days.filter((d) => !isWeekend(d.date) || d.meals_delivered > 0);
  }, [report]);

  const maxMeals = useMemo(() => {
    if (!report) return 0;
    return Math.max(report.enrolled_students, ...report.days.map((d) => d.meals_delivered), 1);
  }, [report]);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}><span className="desktop-only">Cerrar sesión</span><span className="mobile-only">Salir</span></button>
        </div>
      </nav>
      <main className="dashboard-body">
        <div style={{ marginBottom: 20 }}>
          <p className="dashboard-label">Auditoría</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>🧾 Auditoría de Pensión Incluida</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Comidas entregadas por día, cruzadas con asistencia y matrícula
          </p>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <div className="form-group">
            <label className="form-label" htmlFor="school">Colegio</label>
            <select id="school" className="form-select" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">Selecciona un colegio...</option>
              {schoolOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '8px 0 20px' }}>
          <button className="btn-ghost" onClick={() => changeMonth(-1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>{MONTH_NAMES[month - 1]} {year}</span>
          <button className="btn-ghost" onClick={() => changeMonth(1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
        </div>

        {!schoolId && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ margin: 0, fontSize: 14 }}>Selecciona un colegio para ver su auditoría.</p>
          </div>
        )}

        {schoolId && loading && <div className="roadmap-note">Cargando reporte...</div>}
        {schoolId && error && <p className="form-error">{error}</p>}

        {schoolId && !loading && !error && report && (
          <>
            {report.school.meal_payment_model !== 'INCLUDED' && (
              <div className="roadmap-note" style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13 }}>
                  ⚠️ Este colegio no está en modalidad de pensión incluida. Este reporte solo tiene sentido para colegios con esa modalidad — los números abajo probablemente estén en cero.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
              <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comidas entregadas</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand-deep)' }}>{report.total_meals_delivered}</p>
              </div>
              <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio diario</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{report.avg_meals_per_day}</p>
              </div>
              <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matriculados</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#3772cf' }}>{report.enrolled_students}</p>
              </div>
              <div className="user-card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Costo estimado</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#059669' }}>
                  {report.estimated_cost !== null ? fmt(report.estimated_cost) : '—'}
                </p>
                {report.estimated_cost === null && (
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>Configura el costo por comida en el colegio</p>
                )}
              </div>
            </div>

            {!report.has_attendance_data && (
              <div className="roadmap-note" style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 12.5 }}>
                  ℹ️ No hay datos de asistencia QR este mes — activa "asistencia por QR" en el colegio y pide a los profesores escanear la llegada de los estudiantes para cruzarla con las comidas entregadas.
                </p>
              </div>
            )}

            <div className="user-card">
              <p className="dashboard-label" style={{ marginBottom: 14 }}>Comidas entregadas por día {report.has_attendance_data && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(línea azul = asistencia QR)</span>}</p>
              {visibleDays.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0' }}>Sin comidas entregadas registradas este mes.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleDays.map((d) => (
                  <DayBar key={d.date} date={d.date} meals={d.meals_delivered} attendance={d.attendance_count} max={maxMeals} hasAttendance={report.has_attendance_data} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
