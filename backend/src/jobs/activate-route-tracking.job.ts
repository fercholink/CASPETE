/**
 * Job: Activa la ventana de evaluación de desviación de ruta (georuta)
 * ─────────────────────────────────────────────────────────────────
 * Ejecuta cada 5 minutos. Para cada tarjeta con georuta configurada, si
 * "ahora" cae dentro del margen de trayecto (antes de entrar o después de
 * salir del colegio — mismo margen que ya usa el rastreo GPS normal),
 * renueva su activación por 10 minutos más en la Plataforma GPS. Así se
 * auto-extiende mientras dure el trayecto y expira sola en cuanto el job
 * deja de renovarla — sin necesidad de un paso explícito de desactivación.
 *
 * Fuera de esos márgenes (durante clase, o en casa de noche) no se activa,
 * para no generar alertas falsas de "desviación" cuando el estudiante está
 * quieto y lejos de la línea recta casa↔colegio.
 */
import { prisma } from '../lib/prisma.js';
import { captureError } from '../lib/monitoring.js';
import * as gpsPlatform from '../lib/gpsPlatform.js';

const TRAYECTO_MARGIN_MIN = 45;
const BOGOTA_UTC_OFFSET_HOURS = -5;
const ACTIVATION_MINUTES = 10; // >  intervalo del cron (5 min), para que la renovación llegue antes de expirar

function isInCommuteWindow(now: Date, startTime: string, endTime: string): boolean {
  const bogotaMinutes = ((now.getUTCHours() + BOGOTA_UTC_OFFSET_HOURS + 24) % 24) * 60 + now.getUTCMinutes();
  const [startH, startM] = startTime.split(':').map(Number) as [number, number];
  const [endH, endM] = endTime.split(':').map(Number) as [number, number];
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  const morningStart = start - TRAYECTO_MARGIN_MIN;
  const afternoonEnd = end + TRAYECTO_MARGIN_MIN;

  return (bogotaMinutes >= morningStart && bogotaMinutes <= start) || (bogotaMinutes >= end && bogotaMinutes <= afternoonEnd);
}

export async function runActivateRouteTrackingJob(): Promise<void> {
  const label = '[CRON:activate-route-tracking]';
  if (!gpsPlatform.isConfigured()) return;

  try {
    const trackers = await prisma.gPSTracker.findMany({
      where: { platform_route_id: { not: null }, platform_tracker_id: { not: null }, active: true },
      select: {
        platform_tracker_id: true,
        platform_route_id: true,
        student: { select: { school: { select: { school_start_time: true, school_end_time: true } } } },
      },
    });

    const now = new Date();
    let activated = 0;
    for (const tracker of trackers) {
      const school = tracker.student?.school;
      if (!school?.school_start_time || !school?.school_end_time) continue;
      if (!isInCommuteWindow(now, school.school_start_time, school.school_end_time)) continue;

      await gpsPlatform
        .activateRouteTracking(tracker.platform_route_id!, tracker.platform_tracker_id!, ACTIVATION_MINUTES)
        .catch((err) => captureError(err, 'cron', { platformTrackerId: tracker.platform_tracker_id }));
      activated++;
    }

    if (activated > 0) console.log(`${label} Ventana de trayecto activa para ${activated} tarjeta(s)`);
  } catch (err) {
    captureError(err, 'cron');
  }
}
