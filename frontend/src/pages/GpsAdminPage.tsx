import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import GpsTrackerPanel from '../components/GpsTrackerPanel';
import GpsPaymentsPage from './GpsPaymentsPage';
import GpsDeviceOrdersPage from './GpsDeviceOrdersPage';
import GpsGalleryPage from './GpsGalleryPage';
import GpsGeofencesPage from './GpsGeofencesPage';

const TABS = [
  { key: 'diagnostico', label: '🔍 Diagnóstico' },
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

/** Buscar un estudiante y ver/probar/configurar su localizador — mismo panel que en el modal del padre. */
function DiagnosticoTab() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');

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
  const [tab, setTab] = useState<TabKey>('diagnostico');

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

        {tab === 'diagnostico' && <DiagnosticoTab />}
        {tab === 'tarifas' && <TarifasTab />}
        {tab === 'pagos' && <GpsPaymentsPage />}
        {tab === 'pedidos' && <GpsDeviceOrdersPage />}
        {tab === 'galeria' && <GpsGalleryPage />}
        {tab === 'geocercas' && <GpsGeofencesPage />}
      </main>
    </>
  );
}
