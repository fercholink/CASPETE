import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Geofence {
  id: string;
  name: string;
  shape: 'CIRCLE' | 'POLYGON';
  latitude: string | null;
  longitude: string | null;
  radius_meters: number | null;
  points: { lat: number; lon: number }[] | null;
  active: boolean;
}

export default function GpsGeofencesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [shape, setShape] = useState<'CIRCLE' | 'POLYGON'>('CIRCLE');
  const [name, setName] = useState('');
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [radius, setRadius] = useState('150');
  const [points, setPoints] = useState<{ lat: number; lon: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const mapRef = useRef<L.Map | null>(null);
  const drawLayerRef = useRef<L.Layer[]>([]);

  useEffect(() => { fetchGeofences(); }, []);

  async function fetchGeofences() {
    setLoading(true);
    try {
      const r = await apiClient.get<{ data: Geofence[] }>('/gps-geofences');
      setGeofences(r.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function toggleActive(g: Geofence) {
    try {
      await apiClient.patch(`/gps-geofences/${g.id}`, { active: !g.active });
      fetchGeofences();
    } catch {}
  }

  function openCreate() {
    setShape('CIRCLE');
    setName('');
    setCenter(null);
    setRadius('150');
    setPoints([]);
    setSaveError('');
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    drawLayerRef.current = [];
  }

  const setMapContainer = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      const map = L.map(node).setView([4.6579, -74.0937], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      map.on('click', (e: L.LeafletMouseEvent) => {
        const p = { lat: e.latlng.lat, lon: e.latlng.lng };
        setShape((currentShape) => {
          if (currentShape === 'CIRCLE') {
            setCenter(p);
          } else {
            setPoints((prev) => [...prev, p]);
          }
          return currentShape;
        });
      });
      mapRef.current = map;
    } else if (!node && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  // Redibuja el círculo o el polígono en construcción cuando cambian los puntos
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    drawLayerRef.current.forEach((layer) => layer.remove());
    drawLayerRef.current = [];

    if (shape === 'CIRCLE' && center) {
      const circle = L.circle([center.lat, center.lon], { radius: Number(radius) || 150, color: '#059669' }).addTo(map);
      const marker = L.marker([center.lat, center.lon]).addTo(map);
      drawLayerRef.current = [circle, marker];
    } else if (shape === 'POLYGON' && points.length > 0) {
      const latlngs: [number, number][] = points.map((p) => [p.lat, p.lon]);
      const markers = points.map((p) => L.circleMarker([p.lat, p.lon], { radius: 5, color: '#059669' }).addTo(map));
      drawLayerRef.current = [...markers];
      if (points.length >= 2) {
        const poly = L.polygon(latlngs, { color: '#059669', fillOpacity: 0.15 }).addTo(map);
        drawLayerRef.current.push(poly);
      }
    }
  }, [shape, center, radius, points]);

  function undoLastPoint() {
    setPoints((prev) => prev.slice(0, -1));
  }

  async function handleSave() {
    setSaveError('');
    if (!name.trim()) { setSaveError('Ponle un nombre a la geocerca'); return; }
    if (shape === 'CIRCLE' && !center) { setSaveError('Haz clic en el mapa para marcar el centro'); return; }
    if (shape === 'POLYGON' && points.length < 3) { setSaveError('Marca al menos 3 puntos en el mapa'); return; }

    setSaving(true);
    try {
      await apiClient.post('/gps-geofences', {
        name: name.trim(),
        shape,
        ...(shape === 'CIRCLE'
          ? { latitude: center!.lat, longitude: center!.lon, radius_meters: Number(radius) }
          : { points }),
      });
      closeCreate();
      fetchGeofences();
    } catch (e: any) {
      setSaveError(e?.response?.data?.error ?? 'Error al guardar la geocerca');
    } finally {
      setSaving(false);
    }
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="dashboard-label">GPS</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Geocercas Adicionales</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
              Zonas extra (circulares o poligonales) más allá de la geocerca automática de cada colegio. Vincula un localizador a una desde el panel del estudiante.
            </p>
          </div>
          <button className="btn-primary" style={{ flexShrink: 0, fontSize: 13, padding: '8px 18px' }} onClick={openCreate}>
            + Nueva geocerca
          </button>
        </div>

        {loading && <div className="roadmap-note">Cargando...</div>}
        {!loading && geofences.length === 0 && <div className="roadmap-note">No hay geocercas adicionales todavía.</div>}

        {!loading && geofences.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {geofences.map((g) => (
              <div key={g.id} className="user-card" style={{ padding: '16px 20px', marginBottom: 0, opacity: g.active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</span>
                      <span className="role-badge" style={{ fontSize: 10, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                        {g.shape === 'CIRCLE' ? '⭕ Círculo' : '▱ Polígono'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {g.shape === 'CIRCLE'
                        ? `Radio: ${g.radius_meters}m · ${Number(g.latitude).toFixed(5)}, ${Number(g.longitude).toFixed(5)}`
                        : `${g.points?.length ?? 0} puntos`}
                    </p>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => toggleActive(g)}>
                    {g.active ? '✓ Activa' : 'Inactiva'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => !saving && closeCreate()}>
          <div className="user-card" style={{ maxWidth: 640, width: '100%', padding: 24, marginBottom: 0, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Nueva geocerca</h2>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={closeCreate}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ruta peligrosa Av. 4ta" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, background: shape === 'CIRCLE' ? 'var(--color-brand-light)' : undefined }}
                onClick={() => { setShape('CIRCLE'); setPoints([]); }}
              >
                ⭕ Círculo
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1, background: shape === 'POLYGON' ? 'var(--color-brand-light)' : undefined }}
                onClick={() => { setShape('POLYGON'); setCenter(null); }}
              >
                ▱ Polígono
              </button>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)' }}>
              {shape === 'CIRCLE'
                ? 'Haz clic en el mapa para marcar el centro.'
                : `Haz clic para agregar puntos (mínimo 3). Llevas ${points.length}.`}
            </p>

            <div ref={setMapContainer} style={{ width: '100%', height: 320, borderRadius: 12, marginBottom: 12, border: '1px solid var(--color-border)' }} />

            {shape === 'CIRCLE' ? (
              <div className="form-group">
                <label className="form-label">Radio (metros)</label>
                <input className="form-input" type="number" min={10} max={50000} value={radius} onChange={(e) => setRadius(e.target.value)} />
              </div>
            ) : (
              <button className="btn-ghost" style={{ marginBottom: 12 }} disabled={points.length === 0} onClick={undoLastPoint}>
                ↩ Deshacer último punto
              </button>
            )}

            {saveError && <p className="form-error">{saveError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={saving} onClick={closeCreate}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando...' : '💾 Guardar geocerca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
