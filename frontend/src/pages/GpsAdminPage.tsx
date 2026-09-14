import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import GpsTrackerPanel from '../components/GpsTrackerPanel';
import GpsPaymentsPage from './GpsPaymentsPage';
import GpsDeviceOrdersPage from './GpsDeviceOrdersPage';
import GpsGalleryPage from './GpsGalleryPage';
import GpsGeofencesPage from './GpsGeofencesPage';

const TABS = [
  { key: 'diagnostico', label: '🔍 Diagnóstico' },
  { key: 'activos', label: '🟢 Activos' },
  { key: 'guia', label: '📖 Guía de activación' },
  { key: 'tarifas', label: '⚙️ Tarifas y Precios' },
  { key: 'pagos', label: '💳 Pagos' },
  { key: 'pedidos', label: '📦 Pedidos' },
  { key: 'galeria', label: '🖼️ Galería' },
  { key: 'geocercas', label: '▱ Geocercas' },
] as const;
type TabKey = typeof TABS[number]['key'];

interface GpsPricingData {
  device_price: number;
  monthly_price: number;
  extra_guardian_price: number;
  included_guardians: number;
  max_emergency_numbers: number;
}

function TarifasTab() {
  const [pricing, setPricing] = useState<GpsPricingData>({
    device_price: 120000,
    monthly_price: 30000,
    extra_guardian_price: 5000,
    included_guardians: 1,
    max_emergency_numbers: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get<{ data: GpsPricingData }>('/gps/pricing');
      if (res.data?.data) {
        setPricing(res.data.data);
      }
    } catch {
      setErrorMsg('No se pudieron cargar las tarifas actuales del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await apiClient.put<{ message?: string; data: GpsPricingData }>('/gps/pricing', {
        device_price: Number(pricing.device_price),
        monthly_price: Number(pricing.monthly_price),
        extra_guardian_price: Number(pricing.extra_guardian_price),
        included_guardians: Number(pricing.included_guardians),
        max_emergency_numbers: Number(pricing.max_emergency_numbers),
      });

      setSuccessMsg(res.data?.message || 'Tarifas actualizadas exitosamente');
      if (res.data?.data) {
        setPricing(res.data.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      setErrorMsg(msg || 'Error al guardar las nuevas tarifas');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando tarifas globales...</p>;
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
            ⚙️ Configuración Global de Tarifas GPS
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Como cuenta Master (Super Administrador), los precios definidos aquí se aplicarán a las nuevas compras en la landing page, órdenes de dispositivos y mensualidades base de los padres.
          </p>
        </div>

        {successMsg && (
          <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#166534', fontWeight: 600 }}>✓ {successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>⚠️ {errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Precio Dispositivo */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>📦 Precio de Venta del Localizador GPS (COP):</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-brand-deep)' }}>
                ${Number(pricing.device_price || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Pago único del padre por el dispositivo físico con tarjeta SIM 4G incluida.
            </p>
            <input
              type="number"
              min={0}
              step={1000}
              required
              className="form-input"
              value={pricing.device_price}
              onChange={(e) => setPricing({ ...pricing, device_price: Number(e.target.value) })}
            />
          </div>

          {/* Mensualidad Base */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>📅 Tarifa Mensual Base GPS (COP / mes):</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-brand-deep)' }}>
                ${Number(pricing.monthly_price || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Cobro mensual regular. Incluye minutos ilimitados a los números autorizados y los familiares incluidos por defecto.
            </p>
            <input
              type="number"
              min={0}
              step={1000}
              required
              className="form-input"
              value={pricing.monthly_price}
              onChange={(e) => setPricing({ ...pricing, monthly_price: Number(e.target.value) })}
            />
          </div>

          {/* Familiar adicional */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>👨‍👩‍👦 Tarifa por Familiar Adicional (COP / mes):</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-brand-deep)' }}>
                +${Number(pricing.extra_guardian_price || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Costo adicional por cada persona extra agregada al círculo de confianza más allá del cupo incluido.
            </p>
            <input
              type="number"
              min={0}
              step={500}
              required
              className="form-input"
              value={pricing.extra_guardian_price}
              onChange={(e) => setPricing({ ...pricing, extra_guardian_price: Number(e.target.value) })}
            />
          </div>

          {/* Cupo incluido y contactos de emergencia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Cupo de Familiares Incluidos ($0 extra):
              </label>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                Generalmente 1 (Mamá o Papá con cuenta propia).
              </p>
              <input
                type="number"
                min={1}
                max={10}
                required
                className="form-input"
                value={pricing.included_guardians}
                onChange={(e) => setPricing({ ...pricing, included_guardians: Number(e.target.value) })}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Máximo Números Autorizados (Llamadas):
              </label>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                Generalmente 3 contactos directos.
              </p>
              <input
                type="number"
                min={1}
                max={10}
                required
                className="form-input"
                value={pricing.max_emergency_numbers}
                onChange={(e) => setPricing({ ...pricing, max_emergency_numbers: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={loadPricing}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Descartar cambios
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ flex: 2, padding: '12px 20px', fontSize: 14, fontWeight: 700 }}
            >
              {saving ? 'Guardando tarifas...' : '💾 Guardar Nuevas Tarifas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StudentOption { id: string; full_name: string; school: { name: string } }

interface TrackerListItem {
  id: string;
  device_name: string | null;
  student_id: string | null;
  student_name: string;
  school_name: string | null;
  online: boolean;
  battery_level: number | null;
  last_seen_at: string | null;
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return 'Nunca conectado';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Desde ${new Date(iso).toLocaleDateString('es-CO')}`;
}

/** Lista de todos los localizadores vinculados con su estado en vivo (en línea/desconectado, batería). */
function ActivosTab({ onViewStudent }: { onViewStudent: (studentId: string, studentName: string) => void }) {
  const [trackers, setTrackers] = useState<TrackerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiClient.get<{ data: TrackerListItem[] }>('/gps/trackers')
      .then((r) => setTrackers(r.data.data))
      .catch(() => setError('No se pudieron cargar los localizadores'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onlineCount = trackers.filter((t) => t.online).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
          {loading ? 'Cargando...' : `🟢 ${onlineCount} en línea de ${trackers.length} localizadores vinculados`}
        </p>
        <button className="btn-ghost" onClick={load} disabled={loading} style={{ fontSize: 12, padding: '6px 14px' }}>
          ↻ Actualizar
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!loading && !error && trackers.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No hay localizadores vinculados todavía.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trackers.map((t) => (
          <div
            key={t.id}
            className="user-card"
            style={{ margin: 0, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <div style={{ minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.online ? '#10b981' : '#d1d5db', flexShrink: 0 }} />
                <strong style={{ fontSize: 14 }}>{t.student_name}</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {t.school_name ?? 'Sin colegio'} · {t.device_name ?? 'Sin nombre'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span>🔋 {t.battery_level ?? '—'}%</span>
              <span style={{ color: t.online ? '#059669' : 'var(--color-text-muted)', fontWeight: 600 }}>
                {t.online ? 'En línea' : formatLastSeen(t.last_seen_at)}
              </span>
              {t.student_id && (
                <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onViewStudent(t.student_id!, t.student_name)}>
                  Ver diagnóstico
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GuiaStep {
  title: string;
  description: string;
  command?: string;
}

const ACTIVATION_STEPS: GuiaStep[] = [
  {
    title: 'Encender el dispositivo',
    description: 'Con la SIM ya insertada, mantén presionado el botón de encendido unos segundos hasta que prenda.',
  },
  {
    title: 'Configurar el APN de datos (solo si la SIM no trae datos activados por defecto)',
    description: 'Sin esto el dispositivo puede no tener internet para conectarse, aunque el paso siguiente responda OK. Envía por SMS al número de la SIM del dispositivo:',
    command: 'APN,<apn>,<usuario>,<clave>#',
  },
  {
    title: 'Apuntar el dispositivo al servidor de Kidway',
    description: 'Desde otro celular, envía al número de la SIM. Debe responder "Set OK!":',
    command: 'SERVER,38.191.208.30,5002#',
  },
  {
    title: 'Confirmar la configuración y obtener el IMEI',
    description: 'Responde con servidor:puerto;imei;...;firmware;fecha. Verifica que diga 38.191.208.30:5002 y copia el IMEI:',
    command: 'INFO#',
  },
  {
    title: 'Vincular el IMEI al estudiante',
    description: 'En la pestaña 🔍 Diagnóstico, busca al estudiante y vincula el localizador con el IMEI real y el número de la SIM del dispositivo.',
  },
  {
    title: 'Verificar la conexión',
    description: 'En la pestaña 🟢 Activos (o en Diagnóstico) debe pasar de "Sin conexión" a "En línea" con batería reportada — puede tardar 1-2 minutos en llegar el primer reporte.',
  },
];

function GuiaTab() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--color-border)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>📖 Activar un localizador GPS nuevo</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Procedimiento completo desde que el dispositivo llega con la SIM instalada hasta que aparece "En línea" en el panel.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ACTIVATION_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--color-brand-deep)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>{step.title}</p>
                <p style={{ margin: step.command ? '0 0 8px' : 0, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.description}</p>
                {step.command && (
                  <code style={{
                    display: 'inline-block', background: '#0f172a', color: '#e2e8f0', padding: '6px 12px',
                    borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)',
                  }}>
                    {step.command}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fef2f2', border: '1px solid #fca5a5' }}>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
          ⚠️ Este modelo no tiene contraseña SMS
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
          Cualquiera que tenga el número de la SIM podría mandarle <code>FACTORY#</code> (borra toda la configuración,
          incluido el servidor) o <code>RESET#</code>. Trata el número de la SIM como dato sensible — solo visible
          para SUPER_ADMIN. Si un dispositivo se desconecta y no vuelve a aparecer "En línea" en un tiempo razonable,
          revisa si necesita reconfigurarse desde el paso 3.
        </p>
      </div>
    </div>
  );
}

/** Buscar un estudiante y ver/probar/configurar su localizador — mismo panel que en el modal del padre. */
function DiagnosticoTab({ initialStudentId, initialStudentName }: { initialStudentId?: string | null; initialStudentName?: string }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialStudentId ?? null);
  const [selectedName, setSelectedName] = useState(initialStudentName ?? '');

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams();
      p.set('search', search); p.set('limit', '10');
      apiClient.get<{ data: { students: StudentOption[] } }>(`/students?${p}`)
        .then((r) => setResults(r.data.data.students))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  if (selectedId) {
    return (
      <div>
        <button className="btn-ghost" style={{ marginBottom: 16 }} onClick={() => setSelectedId(null)}>
          ← Buscar otro estudiante {selectedName && `(viendo a ${selectedName})`}
        </button>
        <div className="user-card" style={{ maxWidth: 480, padding: '32px 28px', marginBottom: 0 }}>
          <GpsTrackerPanel studentId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        Busca un estudiante para ver la info de su localizador (batería, señal, ICCID, conexión) y mandarle comandos: alarma, SOS, posición bajo demanda, LBS, sobrevelocidad, vibración, apagar.
      </p>
      <input
        className="form-input" placeholder="Buscar estudiante por nombre..."
        value={search} onChange={(e) => { setSearch(e.target.value); setSelectedName(''); }}
        style={{ maxWidth: 400 }}
      />
      {loading && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10 }}>Buscando...</p>}
      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, maxWidth: 400 }}>
          {results.map((s) => (
            <button
              key={s.id} className="user-card"
              style={{ textAlign: 'left', padding: '12px 16px', marginBottom: 0, cursor: 'pointer', border: 'none' }}
              onClick={() => { setSelectedId(s.id); setSelectedName(s.full_name); }}
            >
              <strong>{s.full_name}</strong>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)' }}>{s.school?.name}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && search.trim() && results.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10 }}>Sin resultados.</p>
      )}
    </div>
  );
}

export default function GpsAdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as TabKey | null;
  const tab: TabKey = rawTab && TABS.some((t) => t.key === rawTab) ? rawTab : 'diagnostico';
  const setTab = (key: TabKey) => setSearchParams({ tab: key }, { replace: true });
  const [jumpToStudent, setJumpToStudent] = useState<{ id: string; name: string } | null>(null);

  function handleViewStudentDiagnostic(studentId: string, studentName: string) {
    setJumpToStudent({ id: studentId, name: studentName });
    setTab('diagnostico');
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="auth-page"><p className="form-error">Acceso denegado</p></div>;
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />KIDWAY</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            <span className="desktop-only">Cerrar sesión</span>
            <span className="mobile-only">Salir</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 20 }}>
          <p className="dashboard-label">GPS</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Módulo GPS</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Todo lo relacionado con los localizadores en un solo lugar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap',
                color: tab === t.key ? 'var(--color-brand-deep)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-brand-deep)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'diagnostico' && (
          <DiagnosticoTab
            key={jumpToStudent?.id ?? 'none'}
            initialStudentId={jumpToStudent?.id}
            initialStudentName={jumpToStudent?.name}
          />
        )}
        {tab === 'activos' && <ActivosTab onViewStudent={handleViewStudentDiagnostic} />}
        {tab === 'guia' && <GuiaTab />}
        {tab === 'tarifas' && <TarifasTab />}
        {tab === 'pagos' && <GpsPaymentsPage />}
        {tab === 'pedidos' && <GpsDeviceOrdersPage />}
        {tab === 'galeria' && <GpsGalleryPage />}
        {tab === 'geocercas' && <GpsGeofencesPage />}
      </main>
    </>
  );
}
