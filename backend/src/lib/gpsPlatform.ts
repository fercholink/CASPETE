/**
 * Cliente HTTP de la Plataforma GPS (servicio externo — gps.bscomunicaciones.com)
 *
 * Kidway ya no recibe la conexión TCP real de las tarjetas GPS: el dispositivo
 * apunta a la Plataforma GPS, que es quien ingesta y guarda las posiciones.
 * Este cliente consulta esa plataforma vía su API HTTP (Authorization: Bearer <api_key>).
 */
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';

export interface PlatformTracker {
  id: string;
  imei: string;
  external_ref: string | null;
  device_name: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  online: boolean;
  last_seen_at: string | null;
  active: boolean;
  created_at: string;
  sos_number: string | null;
  dad_number: string | null;
  mom_number: string | null;
}

export interface PlatformPosition {
  id: string;
  tracker_id: string;
  latitude: string;
  longitude: string;
  speed: string | null;
  heading: string | null;
  altitude: string | null;
  source: 'GPS' | 'LBS';
  recorded_at: string;
  created_at: string;
}

export interface PlatformGeofence {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
  active: boolean;
  created_at: string;
}

export interface PlatformRoute {
  id: string;
  name: string;
  points: { lat: number; lon: number }[];
  corridor_meters: number;
  active: boolean;
  created_at: string;
}

export interface PlatformEvent {
  id: string;
  tracker_id: string;
  type:
    | 'SOS' | 'OVERSPEED' | 'VIBRATION' | 'CHARGING_CONNECTED' | 'CHARGING_DISCONNECTED'
    | 'CHARGING_COMPLETE' | 'LOW_BATTERY' | 'DEVICE_REMOVED' | 'DEVICE_WORN'
    | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'ROUTE_DEVIATION' | 'ROUTE_RESTORED';
  speed_kmh: number | null;
  geofence_id: string | null;
  route_id: string | null;
  recorded_at: string;
  created_at: string;
}

function isConfigured(): boolean {
  return !!env.GPS_PLATFORM_API_KEY;
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!isConfigured()) throw new AppError('La Plataforma GPS no está configurada', 503);

  const res = await fetch(`${env.GPS_PLATFORM_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GPS_PLATFORM_API_KEY}`,
      ...init?.headers,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Error de la Plataforma GPS (${res.status}): ${body}`, 502);
  }

  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export async function findTrackerByImei(imei: string): Promise<PlatformTracker | null> {
  return request<PlatformTracker>(`/trackers/by-imei/${encodeURIComponent(imei)}`);
}

export async function registerTracker(
  imei: string,
  externalRef?: string,
  deviceName?: string,
): Promise<PlatformTracker> {
  const existing = await findTrackerByImei(imei);
  if (existing) return existing;

  const tracker = await request<PlatformTracker>('/trackers', {
    method: 'POST',
    body: JSON.stringify({ imei, external_ref: externalRef, device_name: deviceName }),
  });
  if (!tracker) throw new AppError('No se pudo registrar el rastreador en la Plataforma GPS', 502);
  return tracker;
}

export async function getTrackerStatus(platformTrackerId: string): Promise<PlatformTracker | null> {
  return request<PlatformTracker>(`/trackers/${platformTrackerId}`);
}

export async function getLatestPosition(platformTrackerId: string): Promise<PlatformPosition | null> {
  return request<PlatformPosition>(`/trackers/${platformTrackerId}/position`);
}

export async function getPositionHistory(
  platformTrackerId: string,
  hours: number,
): Promise<PlatformPosition[]> {
  const result = await request<{ positions: PlatformPosition[] }>(
    `/trackers/${platformTrackerId}/positions?limit=200`,
  );
  if (!result) return [];

  const since = Date.now() - hours * 60 * 60 * 1000;
  return result.positions
    .filter((p) => new Date(p.recorded_at).getTime() >= since)
    .reverse(); // la API devuelve más reciente primero; el historial se dibuja en orden cronológico
}

/** Historial de un día calendario completo (hora Bogotá, UTC-5) — para el selector de fecha. */
export async function getPositionHistoryForDay(platformTrackerId: string, date: string): Promise<PlatformPosition[]> {
  const since = new Date(`${date}T00:00:00-05:00`);
  const until = new Date(`${date}T23:59:59.999-05:00`);

  const result = await request<{ positions: PlatformPosition[] }>(
    `/trackers/${platformTrackerId}/positions?since=${encodeURIComponent(since.toISOString())}&until=${encodeURIComponent(until.toISOString())}&limit=2000`,
  );
  if (!result) return [];
  return result.positions.slice().reverse(); // la API devuelve más reciente primero; se dibuja en orden cronológico
}

export async function getRoute(routeId: string): Promise<PlatformRoute | null> {
  return request<PlatformRoute>(`/routes/${routeId}`);
}

/** Crea o actualiza la geocerca de un colegio en la Plataforma GPS. */
export async function upsertGeofence(
  existingGeofenceId: string | null,
  name: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<PlatformGeofence> {
  if (existingGeofenceId) {
    const updated = await request<PlatformGeofence>(`/geofences/${existingGeofenceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, latitude, longitude, radius_meters: radiusMeters }),
    });
    if (updated) return updated;
    // si ya no existe en la Plataforma GPS (ej. se borró manualmente), se crea una nueva
  }

  const created = await request<PlatformGeofence>('/geofences', {
    method: 'POST',
    body: JSON.stringify({ name, latitude, longitude, radius_meters: radiusMeters }),
  });
  if (!created) throw new AppError('No se pudo crear la geocerca en la Plataforma GPS', 502);
  return created;
}

export async function linkTrackerToGeofence(geofenceId: string, platformTrackerId: string): Promise<void> {
  await request(`/geofences/${geofenceId}/trackers`, {
    method: 'POST',
    body: JSON.stringify({ tracker_id: platformTrackerId }),
  });
}

/** Crea o actualiza el trayecto esperado (casa↔colegio) de un estudiante en la Plataforma GPS. */
export async function upsertRoute(
  existingRouteId: string | null,
  name: string,
  points: { lat: number; lon: number }[],
  corridorMeters: number,
): Promise<PlatformRoute> {
  if (existingRouteId) {
    const updated = await request<PlatformRoute>(`/routes/${existingRouteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, points, corridor_meters: corridorMeters }),
    });
    if (updated) return updated;
  }

  const created = await request<PlatformRoute>('/routes', {
    method: 'POST',
    body: JSON.stringify({ name, points, corridor_meters: corridorMeters }),
  });
  if (!created) throw new AppError('No se pudo crear la ruta en la Plataforma GPS', 502);
  return created;
}

export async function linkTrackerToRoute(routeId: string, platformTrackerId: string): Promise<void> {
  await request(`/routes/${routeId}/trackers`, {
    method: 'POST',
    body: JSON.stringify({ tracker_id: platformTrackerId }),
  });
}

/** Activa la evaluación de desviación de ruta por `minutes` — se llama repetidamente durante la ventana de trayecto para renovarla. */
export async function activateRouteTracking(routeId: string, platformTrackerId: string, minutes: number): Promise<void> {
  await request(`/routes/${routeId}/trackers/${platformTrackerId}/activate`, {
    method: 'PATCH',
    body: JSON.stringify({ minutes }),
  });
}

/**
 * Cambia el intervalo de reporte de posición del dispositivo (protocolo
 * 0x97, 10-7200 segundos). Se usa para pedir reportes más frecuentes durante
 * la ventana de trayecto y volver a un intervalo normal fuera de ella — la
 * Plataforma GPS ya deduplica: si el valor no cambió, no reenvía el comando.
 */
export async function setReportInterval(platformTrackerId: string, seconds: number): Promise<void> {
  await request(`/trackers/${platformTrackerId}/report-interval`, {
    method: 'PATCH',
    body: JSON.stringify({ seconds }),
  });
}

/**
 * Hace sonar (o detiene) el parlante del dispositivo, si tiene. Es una acción
 * momentánea — si el dispositivo está desconectado, la Plataforma GPS
 * responde con error en vez de guardar la intención para más tarde.
 */
export async function findDevice(platformTrackerId: string, active: boolean): Promise<void> {
  await request(`/trackers/${platformTrackerId}/find`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

/**
 * Apaga (o reinicia) el dispositivo. No existe comando para volver a
 * encenderlo remotamente — requiere botón físico o conectarlo al cargador.
 */
export async function sendPowerAction(platformTrackerId: string, action: 'restart' | 'shutdown'): Promise<void> {
  await request(`/trackers/${platformTrackerId}/power`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

export interface AlarmClockEntry {
  weekdays: number; // bitmask 0-127, bit0=lunes ... bit6=domingo
  hour: number;
  minute: number;
}

/** Guarda y envía la alarma de despertador (hasta 3 entradas; [] la cancela). */
export async function setAlarmClock(platformTrackerId: string, alarms: AlarmClockEntry[]): Promise<void> {
  await request(`/trackers/${platformTrackerId}/alarm-clock`, {
    method: 'PATCH',
    body: JSON.stringify({ alarms }),
  });
}

/**
 * Guarda los números que el dispositivo llama al presionar su botón físico de
 * SOS (protocolo 0x41/0x42/0x43). Si la tarjeta está conectada en ese momento
 * se los envía de una vez; si no, la Plataforma GPS los reenvía sola en el
 * próximo login del dispositivo.
 */
export async function setEmergencyContacts(
  platformTrackerId: string,
  contacts: { sos_number?: string | null | undefined; dad_number?: string | null | undefined; mom_number?: string | null | undefined },
): Promise<{ tracker: PlatformTracker; delivered: Record<string, boolean> }> {
  const result = await request<{ tracker: PlatformTracker; delivered: Record<string, boolean> }>(
    `/trackers/${platformTrackerId}/emergency-contacts`,
    { method: 'PATCH', body: JSON.stringify(contacts) },
  );
  if (!result) throw new AppError('No se pudieron guardar los números de contacto', 502);
  return result;
}

/** Eventos de la cuenta (todas las tarjetas) desde `since` — usado por el poller de notificaciones. */
export async function listEventsSince(since: Date | null): Promise<PlatformEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since.toISOString())}&limit=500` : '?limit=500';
  const events = await request<PlatformEvent[]>(`/events${query}`);
  return events ?? [];
}

export { isConfigured };
