import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Allergy {
  id: string;
  name: string;
  severity: string;
}

interface MenuDay {
  id: string;
  school_id: string;
  menu_date: string;
  soup: string | null;
  main_protein: string;
  optional_protein: string | null;
  energetic: string | null;
  dessert: string | null;
  vegetarian_available: boolean;
  allergens: { allergy: Allergy }[];
}

interface SchoolOption {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()}`;
}

function isWeekend(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0 || d.getDay() === 6;
}

const EMPTY_FORM = {
  soup: '', main_protein: '', optional_protein: '', energetic: '', dessert: '',
  vegetarian_available: false, allergy_ids: [] as string[],
};

export default function MonthlyMenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState<string>(user?.school_id ?? '');
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [days, setDays] = useState<MenuDay[] | null>(null);
  const [allergyCatalog, setAllergyCatalog] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Padre: estudiante seleccionado + sus alergias, para la alerta personalizada
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentAllergyIds, setStudentAllergyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      apiClient.get<{ data: SchoolOption[] }>('/schools/active')
        .then((r) => setSchoolOptions(r.data.data))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    apiClient.get<{ data: Allergy[] }>('/allergies')
      .then((r) => setAllergyCatalog(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role !== 'PARENT') return;
    apiClient.get<{ data: { students: Student[] } }>('/students?limit=100')
      .then((r) => {
        const list = r.data.data.students ?? [];
        setStudents(list);
        setSelectedStudentId((prev) => prev || (list[0]?.id ?? ''));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!selectedStudentId) { setStudentAllergyIds(new Set()); return; }
    apiClient.get<{ data: { allergy: Allergy }[] }>(`/allergies/students/${selectedStudentId}`)
      .then((r) => setStudentAllergyIds(new Set(r.data.data.map((a) => a.allergy.id))))
      .catch(() => setStudentAllergyIds(new Set()));
  }, [selectedStudentId]);

  const fetchMonth = useCallback(() => {
    if (!schoolId) { setDays(null); setLoading(false); return; }
    setLoading(true);
    apiClient.get<{ data: MenuDay[] }>(`/monthly-menu/${schoolId}?month=${month}&year=${year}`)
      .then((r) => { setDays(r.data.data); setError(''); })
      .catch((e) => setError((e as any).response?.data?.error ?? 'Error al cargar el menú del mes'))
      .finally(() => setLoading(false));
  }, [schoolId, month, year]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; } else if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  }

  const allDates = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    });
  }, [year, month]);

  const dayByDate = useMemo(() => {
    const map = new Map<string, MenuDay>();
    (days ?? []).forEach((d) => map.set(d.menu_date.slice(0, 10), d));
    return map;
  }, [days]);

  function startEdit(date: string) {
    const existing = dayByDate.get(date);
    setForm(existing ? {
      soup: existing.soup ?? '',
      main_protein: existing.main_protein,
      optional_protein: existing.optional_protein ?? '',
      energetic: existing.energetic ?? '',
      dessert: existing.dessert ?? '',
      vegetarian_available: existing.vegetarian_available,
      allergy_ids: existing.allergens.map((a) => a.allergy.id),
    } : EMPTY_FORM);
    setEditingDate(date);
  }

  async function saveDay() {
    if (!editingDate || !schoolId || !form.main_protein.trim()) return;
    setSaving(true);
    try {
      await apiClient.put(`/monthly-menu/${schoolId}/${editingDate}`, {
        soup: form.soup.trim() || null,
        main_protein: form.main_protein.trim(),
        optional_protein: form.optional_protein.trim() || null,
        energetic: form.energetic.trim() || null,
        dessert: form.dessert.trim() || null,
        vegetarian_available: form.vegetarian_available,
        allergy_ids: form.allergy_ids,
      });
      setEditingDate(null);
      fetchMonth();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Error al guardar el menú del día');
    } finally {
      setSaving(false);
    }
  }

  async function removeDay(date: string) {
    if (!confirm('¿Eliminar el menú registrado para este día?')) return;
    try {
      await apiClient.delete(`/monthly-menu/${schoolId}/${date}`);
      fetchMonth();
    } catch {
      alert('Error al eliminar el menú del día');
    }
  }

  function toggleAllergyInForm(id: string) {
    setForm((f) => ({
      ...f,
      allergy_ids: f.allergy_ids.includes(id) ? f.allergy_ids.filter((x) => x !== id) : [...f.allergy_ids, id],
    }));
  }

  const selectedStudentName = students.find((s) => s.id === selectedStudentId)?.full_name ?? '';

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
          <p className="dashboard-label">{isAdmin ? 'Administración' : 'Alimentación'}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>🍽️ Menú del Mes</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            {isAdmin ? 'Publica el menú diario de tu colegio' : 'Consulta el menú diario del colegio'}
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

        {user?.role === 'PARENT' && students.length > 1 && (
          <div className="form-group">
            <label className="form-label" htmlFor="student">Estudiante</label>
            <select id="student" className="form-select" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}{s.grade ? ` (${s.grade})` : ''}</option>)}
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
            <p style={{ margin: 0, fontSize: 14 }}>Selecciona un colegio para ver su menú.</p>
          </div>
        )}

        {schoolId && loading && <div className="roadmap-note">Cargando menú...</div>}
        {schoolId && error && <p className="form-error">{error}</p>}

        {schoolId && !loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allDates.map((date) => {
              const day = dayByDate.get(date);
              const matchedAllergies = day ? day.allergens.filter((a) => studentAllergyIds.has(a.allergy.id)) : [];
              const hasAlert = user?.role === 'PARENT' && matchedAllergies.length > 0;
              const weekend = isWeekend(date);
              if (weekend && !day) return null;

              return (
                <div key={date} className="user-card" style={{ padding: '16px 20px', marginBottom: 0, border: hasAlert ? '1.5px solid rgba(220,38,38,0.35)' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {fmtDateLabel(date)}
                      </p>
                      {day ? (
                        <>
                          {day.soup && <p style={{ margin: '2px 0', fontSize: 14 }}>🥣 {day.soup}</p>}
                          <p style={{ margin: '2px 0', fontSize: 14, fontWeight: 500 }}>🍗 {day.main_protein}</p>
                          {day.optional_protein && <p style={{ margin: '2px 0', fontSize: 14, color: 'var(--color-text-muted)' }}>🍗 (opción) {day.optional_protein}</p>}
                          {day.energetic && <p style={{ margin: '2px 0', fontSize: 14 }}>🍚 {day.energetic}</p>}
                          {day.dessert && <p style={{ margin: '2px 0', fontSize: 14 }}>🍮 {day.dessert}</p>}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {day.vegetarian_available && (
                              <span className="role-badge" style={{ fontSize: 11, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>🌱 Opción vegetariana</span>
                            )}
                            {day.allergens.map((a) => (
                              <span key={a.allergy.id} className="role-badge" style={{ fontSize: 11, background: 'rgba(217,119,6,0.1)', color: '#b45309' }}>⚠️ {a.allergy.name}</span>
                            ))}
                          </div>
                          {hasAlert && (
                            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1.5px solid rgba(220,38,38,0.25)' }}>
                              <p style={{ margin: 0, fontSize: 12.5, color: '#7f1d1d', fontWeight: 500 }}>
                                ⚠️ Este día contiene {matchedAllergies.map((a) => a.allergy.name).join(', ')} — alérgeno registrado para <strong>{selectedStudentName}</strong>.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {isAdmin ? 'Sin menú publicado aún.' : 'Menú aún no publicado.'}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => startEdit(date)}>
                          {day ? '✏️' : '+ Agregar'}
                        </button>
                        {day && (
                          <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }} onClick={() => removeDay(date)}>
                            🗑
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editingDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }} onClick={() => !saving && setEditingDate(null)}>
          <div className="user-card" style={{ maxWidth: 480, width: '100%', padding: '28px 24px', margin: '24px 0' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Menú del {fmtDateLabel(editingDate)}</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--color-text-muted)' }}>{editingDate}</p>

            <div className="form-group">
              <label className="form-label">Sopa</label>
              <input className="form-input" value={form.soup} onChange={(e) => setForm((f) => ({ ...f, soup: e.target.value }))} placeholder="Sopa de verduras" />
            </div>
            <div className="form-group">
              <label className="form-label">Proteico principal *</label>
              <input className="form-input" value={form.main_protein} onChange={(e) => setForm((f) => ({ ...f, main_protein: e.target.value }))} placeholder="Pollo guisado" required />
            </div>
            <div className="form-group">
              <label className="form-label">Proteico opcional</label>
              <input className="form-input" value={form.optional_protein} onChange={(e) => setForm((f) => ({ ...f, optional_protein: e.target.value }))} placeholder="Carne de res" />
            </div>
            <div className="form-group">
              <label className="form-label">Energético / verdura caliente</label>
              <input className="form-input" value={form.energetic} onChange={(e) => setForm((f) => ({ ...f, energetic: e.target.value }))} placeholder="Arroz, papa a la francesa" />
            </div>
            <div className="form-group">
              <label className="form-label">Postre</label>
              <input className="form-input" value={form.dessert} onChange={(e) => setForm((f) => ({ ...f, dessert: e.target.value }))} placeholder="Gelatina" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: '4px 0 16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.vegetarian_available} onChange={(e) => setForm((f) => ({ ...f, vegetarian_available: e.target.checked }))} style={{ accentColor: 'var(--color-brand)' }} />
              Hay opción vegetariana este día
            </label>

            {allergyCatalog.length > 0 && (
              <div className="form-group">
                <label className="form-label">Alérgenos presentes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allergyCatalog.map((a) => {
                    const active = form.allergy_ids.includes(a.id);
                    return (
                      <button
                        key={a.id} type="button" onClick={() => toggleAllergyInForm(a.id)}
                        className="role-badge"
                        style={{ fontSize: 12, cursor: 'pointer', border: 'none', background: active ? '#b45309' : 'rgba(217,119,6,0.1)', color: active ? '#fff' : '#b45309' }}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={saving} onClick={() => setEditingDate(null)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={saving || !form.main_protein.trim()} onClick={saveDay}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
