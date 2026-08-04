/**
 * Cliente HTTP de la Plataforma GPS (servicio externo — gps.bscomunicaciones.com)
 *
 * Caspete ya no recibe la conexión TCP real de las tarjetas GPS: el dispositivo
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

export { isConfigured };
