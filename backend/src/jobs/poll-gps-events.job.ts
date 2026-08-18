/**
 * Job: Polling de eventos de la Plataforma GPS (geocerca del colegio + georuta)
 * ──────────────────────────────────────────────────────────────────────────
 * Ejecuta cada 2 minutos. La Plataforma GPS evalúa geocercas y rutas al
 * recibir cada posición nueva y registra un TrackerEvent al cambiar de
 * estado — este job los consulta (con ?since= incremental) y notifica por
 * push al padre.
 *
 * lastPolledAt se inicializa al arrancar el servidor (no antes) para no
 * generar una ráfaga de notificaciones por eventos históricos en el primer
 * deploy de esta funcionalidad.
 */

import { prisma } from '../lib/prisma.js';
import { captureError } from '../lib/monitoring.js';
import * as gpsPlatform from '../lib/gpsPlatform.js';
import * as pushService from '../modules/push/push.service.js';
import type { PlatformEvent } from '../lib/gpsPlatform.js';

let lastPolledAt: Date = new Date();

const NOTIFIABLE_TYPES = new Set([
  'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'WIFI_ATTENDANCE_ENTER', 'WIFI_ATTENDANCE_EXIT',
  'ROUTE_DEVIATION', 'ROUTE_RESTORED', 'LOW_BATTERY',
]);

// geofenceName es null para la geocerca automática del colegio (se usa la
// redacción especial "llegó/salió del colegio"); para cualquier geocerca
// adicional se usa su nombre real, para no decir "colegio" en zonas que no lo son.
function buildTitle(type: PlatformEvent['type'], studentName: string, geofenceName: string | null): string | null {
  switch (type) {
    case 'GEOFENCE_ENTER':
      return geofenceName ? `${studentName} entró a "${geofenceName}"` : `${studentName} llegó al colegio`;
    case 'GEOFENCE_EXIT':
      return geofenceName ? `${studentName} salió de "${geofenceName}"` : `${studentName} salió del colegio`;
    // El protocolo no informa qué SSID configurado disparó el aviso (solo entrada/salida),
    // así que el mensaje es genérico — no dice el nombre de la red.
    case 'WIFI_ATTENDANCE_ENTER': return `📶 ${studentName} llegó a la zona de WiFi configurada`;
    case 'WIFI_ATTENDANCE_EXIT': return `📶 ${studentName} salió de la zona de WiFi configurada`;
    case 'ROUTE_DEVIATION': return `${studentName} se desvió de la ruta esperada`;
    case 'ROUTE_RESTORED': return `${studentName} volvió a la ruta esperada`;
    case 'LOW_BATTERY': return `🔋 Batería baja del localizador de ${studentName}`;
    default: return null;
  }
}

function buildTag(type: PlatformEvent['type']): string {
  if (type === 'LOW_BATTERY') return 'gps-battery';
  if (type === 'WIFI_ATTENDANCE_ENTER' || type === 'WIFI_ATTENDANCE_EXIT') return 'gps-wifi-attendance';
  return 'gps-geofence';
}

async function notifyEvent(event: PlatformEvent) {
  const tracker = await prisma.gPSTracker.findFirst({
    where: { platform_tracker_id: event.tracker_id },
    select: { student: { select: { full_name: true, parent_id: true, school: { select: { gps_geofence_id: true } } } } },
  });
  if (!tracker?.student) return;

  let geofenceName: string | null = null;
  const isGeofenceEvent = event.type === 'GEOFENCE_ENTER' || event.type === 'GEOFENCE_EXIT';
  if (isGeofenceEvent && event.geofence_id && event.geofence_id !== tracker.student.school?.gps_geofence_id) {
    const geofence = await gpsPlatform.getGeofence(event.geofence_id).catch(() => null);
    geofenceName = geofence?.name ?? null;
  }

  const title = buildTitle(event.type, tracker.student.full_name, geofenceName);
  if (!title) return;

  const time = new Date(event.recorded_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  await pushService.sendPushToUser(tracker.student.parent_id, {
    title,
    body: `Rastreo GPS · ${time}`,
    tag: buildTag(event.type),
  });
}

export async function runPollGpsEventsJob(): Promise<void> {
  const label = '[CRON:poll-gps-events]';
  if (!gpsPlatform.isConfigured()) return;

  try {
    const events = await gpsPlatform.listEventsSince(lastPolledAt);
    if (events.length === 0) return;

    lastPolledAt = new Date(events[events.length - 1]!.recorded_at);

    const notifiable = events.filter((e) => NOTIFIABLE_TYPES.has(e.type));
    for (const event of notifiable) {
      await notifyEvent(event).catch((err) => captureError(err, 'cron', { eventId: event.id }));
    }

    console.log(`${label} ${events.length} eventos nuevos (${notifiable.length} notificables)`);
  } catch (err) {
    captureError(err, 'cron');
  }
}
