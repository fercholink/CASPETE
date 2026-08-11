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
  { key: 'pagos', label: '💳 Pagos' },
  { key: 'pedidos', label: '📦 Pedidos' },
  { key: 'galeria', label: '🖼️ Galería' },
  { key: 'geocercas', label: '▱ Geocercas' },
] as const;
type TabKey = typeof TABS[number]['key'];

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
        {tab === 'pagos' && <GpsPaymentsPage />}
        {tab === 'pedidos' && <GpsDeviceOrdersPage />}
        {tab === 'galeria' && <GpsGalleryPage />}
        {tab === 'geocercas' && <GpsGeofencesPage />}
      </main>
    </>
  );
}
