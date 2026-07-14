import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../api/client';

interface Student {
  id: string;
  full_name: string;
  photo_url?: string | null;
  grade: string | null;
}

interface TrackerInfo {
  id: string;
  device_name: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  online: boolean;
  last_seen_at: string | null;
  extended_tracking_until: string | null;
}

interface LocationPoint {
  id: string;
  latitude: string;
  longitude: string;
  speed: string | null;
  heading: string | null;
  recorded_at: string;
}

interface LocationResponse {
  tracker: TrackerInfo;
  location: LocationPoint | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return <span>🔋 —</span>;
  const icon = level <= 15 ? '🪫' : '🔋';
  const color = level <= 15 ? '#dc2626' : level <= 40 ? '#c37d0d' : '#059669';
  return <span style={{ color, fontWeight: 600 }}>{icon} {level}%</span>;
}

export default function GPSTrackingPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const hasCenteredRef = useRef(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [current, setCurrent] = useState<LocationResponse | null>(null);
  const [history, setHistory] = useState<LocationPoint[]>([]);
  const [notLinked, setNotLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ data: { students: Student[] } }>('/students?limit=50')
      .then((r) => {
        setStudents(r.data.data.students);
        if (r.data.data.students.length > 0) setSelectedId(r.data.data.students[0]!.id);
      })
      .catch(() => setError('No se pudieron cargar tus hijos'))
      .finally(() => setLoading(false));
  }, []);

  const fetchLocation = useCallback(async (studentId: string) => {
    try {
      const [curRes, histRes] = await Promise.all([
        apiClient.get<{ data: LocationResponse }>(`/gps/trackers/student/${studentId}`),
        apiClient.get<{ data: LocationPoint[] }>(`/gps/trackers/student/${studentId}/history?hours=24`),
      ]);
      setCurrent(curRes.data.data);
      setHistory(histRes.data.data);
      setNotLinked(false);
      setError('');
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setNotLinked(true);
        setCurrent(null);
        setHistory([]);
      } else {
        setError('Error al cargar la ubicación');
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    hasCenteredRef.current = false;
    fetchLocation(selectedId);
    const interval = setInterval(() => fetchLocation(selectedId), 20_000);
    return () => clearInterval(interval);
  }, [selectedId, fetchLocation]);

  // Callback ref (no useEffect+ref): el contenedor aparece condicionalmente
  // (recién después de que "loading" pasa a false), así que un efecto atado
  // al montaje del componente puede correr antes de que el div exista.
  const setMapContainer = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      const map = L.map(node).setView([4.6579, -74.0937], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    } else if (!node && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  // Redibujar marcador + ruta cuando cambian los datos
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }

    if (history.length > 1) {
      const latlngs: [number, number][] = history.map((p) => [parseFloat(p.latitude), parseFloat(p.longitude)]);
      polylineRef.current = L.polyline(latlngs, { color: '#15803d', weight: 3, opacity: 0.55 }).addTo(map);
    }

    map.invalidateSize();

    if (current?.location) {
      const lat = parseFloat(current.location.latitude);
      const lon = parseFloat(current.location.longitude);
      const student = students.find((s) => s.id === selectedId);
      const initial = student?.full_name.charAt(0) ?? '?';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:46px;height:46px;border-radius:50%;background:#15803d;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;overflow:hidden;">${
          student?.photo_url
            ? `<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<span style="color:#fff;font-weight:700;font-size:17px;">${initial}</span>`
        }</div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
      if (!hasCenteredRef.current) {
        map.setView([lat, lon], 16);
        hasCenteredRef.current = true;
      }
    }
  }, [current, history, students, selectedId]);

  const selectedStudent = students.find((s) => s.id === selectedId);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="desktop-only">Inicio</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Seguridad</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Rastreo GPS</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Ubicación durante el horario escolar. Fuera de ese horario, la app no rastrea a tu hijo.
          </p>
        </div>

        {loading && <div className="roadmap-note">Cargando...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && students.length === 0 && (
          <div className="roadmap-note">
            Aún no has registrado hijos. <Link to="/students/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Agregar ahora</Link>
          </div>
        )}

        {!loading && students.length > 0 && (
          <>
            {/* Selector de hijos */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px 8px 8px', borderRadius: 999,
                    border: `1.5px solid ${selectedId === s.id ? 'var(--color-brand-deep)' : 'var(--color-border)'}`,
                    background: selectedId === s.id ? 'rgba(24,226,153,0.08)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  {s.photo_url ? (
                    <img src={s.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                      {s.full_name.charAt(0)}
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {notLinked && (
              <div className="roadmap-note">
                {selectedStudent?.full_name} no tiene un localizador GPS vinculado todavía.{' '}
                <Link to="/students" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Vincular tarjeta →</Link>
              </div>
            )}

            {current && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div className="user-card" style={{ padding: '12px 18px', marginBottom: 0, flex: 1, minWidth: 160 }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, color: current.tracker.online ? '#059669' : 'var(--color-text-muted)' }}>
                    {current.tracker.online ? '🟢 En línea' : '⚪ Sin conexión'}
                  </p>
                </div>
                <div className="user-card" style={{ padding: '12px 18px', marginBottom: 0, flex: 1, minWidth: 160 }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batería</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15 }}><BatteryIcon level={current.tracker.battery_level} /></p>
                </div>
                <div className="user-card" style={{ padding: '12px 18px', marginBottom: 0, flex: 1, minWidth: 160 }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Última actualización</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600 }}>{timeAgo(current.tracker.last_seen_at)}</p>
                </div>
                {current.location && (
                  <div className="user-card" style={{ padding: '12px 18px', marginBottom: 0, flex: 1, minWidth: 160 }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Velocidad</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600 }}>{current.location.speed ?? 0} km/h</p>
                  </div>
                )}
              </div>
            )}

            <div
              ref={setMapContainer}
              style={{
                width: '100%', height: 480, borderRadius: 16,
                border: '1px solid var(--color-border)', overflow: 'hidden',
                display: notLinked ? 'none' : 'block',
              }}
            />
          </>
        )}
      </main>
    </>
  );
}
