/**
 * Job: Polling de eventos de la Plataforma GPS (geocercas del colegio)
 * ──────────────────────────────────────────────────────────────────
 * Ejecuta cada 2 minutos. La Plataforma GPS evalúa geocercas al recibir cada
 * posición nueva y registra un TrackerEvent al cambiar de estado — este job
 * los consulta (con ?since= incremental) y notifica por push al padre.
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

async function notifyGeofenceEvent(event: PlatformEvent) {
  const tracker = await prisma.gPSTracker.findFirst({
    where: { platform_tracker_id: event.tracker_id },
    select: { student: { select: { full_name: true, parent_id: true } } },
  });
  if (!tracker?.student) return;

  const time = new Date(event.recorded_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const title = event.type === 'GEOFENCE_ENTER'
    ? `${tracker.student.full_name} llegó al colegio`
    : `${tracker.student.full_name} salió del colegio`;

  await pushService.sendPushToUser(tracker.student.parent_id, {
    title,
    body: `Rastreo GPS · ${time}`,
    tag: 'gps-geofence',
  });
}

export async function runPollGpsEventsJob(): Promise<void> {
  const label = '[CRON:poll-gps-events]';
  if (!gpsPlatform.isConfigured()) return;

  try {
    const events = await gpsPlatform.listEventsSince(lastPolledAt);
    if (events.length === 0) return;

    lastPolledAt = new Date(events[events.length - 1]!.recorded_at);

    const geofenceEvents = events.filter((e) => e.type === 'GEOFENCE_ENTER' || e.type === 'GEOFENCE_EXIT');
    for (const event of geofenceEvents) {
      await notifyGeofenceEvent(event).catch((err) => captureError(err, 'cron', { eventId: event.id }));
    }

    console.log(`${label} ${events.length} eventos nuevos (${geofenceEvents.length} de geocerca)`);
  } catch (err) {
    captureError(err, 'cron');
  }
}
