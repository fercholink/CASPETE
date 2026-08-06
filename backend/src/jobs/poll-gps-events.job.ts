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

const NOTIFIABLE_TYPES = new Set(['GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'ROUTE_DEVIATION', 'ROUTE_RESTORED', 'LOW_BATTERY']);

function buildTitle(type: PlatformEvent['type'], studentName: string): string | null {
  switch (type) {
    case 'GEOFENCE_ENTER': return `${studentName} llegó al colegio`;
    case 'GEOFENCE_EXIT': return `${studentName} salió del colegio`;
    case 'ROUTE_DEVIATION': return `${studentName} se desvió de la ruta esperada`;
    case 'ROUTE_RESTORED': return `${studentName} volvió a la ruta esperada`;
    case 'LOW_BATTERY': return `🔋 Batería baja del localizador de ${studentName}`;
    default: return null;
  }
}

function buildTag(type: PlatformEvent['type']): string {
  return type === 'LOW_BATTERY' ? 'gps-battery' : 'gps-geofence';
}

async function notifyEvent(event: PlatformEvent) {
  const tracker = await prisma.gPSTracker.findFirst({
    where: { platform_tracker_id: event.tracker_id },
    select: { student: { select: { full_name: true, parent_id: true } } },
  });
  if (!tracker?.student) return;

  const title = buildTitle(event.type, tracker.student.full_name);
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
