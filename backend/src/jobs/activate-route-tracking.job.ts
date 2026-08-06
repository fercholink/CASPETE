/**
 * Job: Activa la ventana de trayecto (georuta) — desviación + reporte rápido
 * ──────────────────────────────────────────────────────────────────────
 * Ejecuta cada 5 minutos. Para cada tarjeta con georuta configurada, si
 * "ahora" cae dentro de la ventana de trayecto:
 *  1. Renueva la evaluación de desviación de ruta por 10 minutos más en la
 *     Plataforma GPS (se auto-extiende mientras dure el trayecto y expira
 *     sola en cuanto el job deja de renovarla).
 *  2. Pide al dispositivo reportar posición cada 10 segundos (en vez del
 *     intervalo normal) para ver el trayecto casi en vivo.
 *
 * La ventana usa el horario exacto que configuró el padre
 * (Student.route_morning_pickup/arrival, route_afternoon_pickup/arrival) si
 * existe; si no, cae al margen automático de ±45 min alrededor del horario
 * escolar del colegio (mismo comportamiento de antes).
 *
 * Fuera de la ventana, el dispositivo vuelve a un intervalo de reporte
 * normal — evita gastar batería/datos reportando cada 10s todo el día.
 */
import { prisma } from '../lib/prisma.js';
import { captureError } from '../lib/monitoring.js';
import * as gpsPlatform from '../lib/gpsPlatform.js';

const TRAYECTO_MARGIN_MIN = 45;
const BOGOTA_UTC_OFFSET_HOURS = -5;
const ACTIVATION_MINUTES = 10; // > intervalo del cron (5 min), para que la renovación llegue antes de expirar
const FAST_REPORT_INTERVAL_SECONDS = 10; // mínimo documentado por el fabricante (protocolo 0x97: 10-7200s)
const NORMAL_REPORT_INTERVAL_SECONDS = 60;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

function bogotaMinutesNow(now: Date): number {
  return ((now.getUTCHours() + BOGOTA_UTC_OFFSET_HOURS + 24) % 24) * 60 + now.getUTCMinutes();
}

interface WindowInputs {
  route_morning_pickup: string | null;
  route_morning_arrival: string | null;
  route_afternoon_pickup: string | null;
  route_afternoon_arrival: string | null;
  school_start_time: string | null;
  school_end_time: string | null;
}

function isInCommuteWindow(now: Date, student: WindowInputs): boolean {
  const nowMinutes = bogotaMinutesNow(now);

  // Mañana: horario configurado por el padre tiene prioridad sobre el margen automático.
  if (student.route_morning_pickup && student.route_morning_arrival) {
    const start = toMinutes(student.route_morning_pickup);
    const end = toMinutes(student.route_morning_arrival);
    if (nowMinutes >= start && nowMinutes <= end) return true;
  } else if (student.school_start_time) {
    const start = toMinutes(student.school_start_time);
    if (nowMinutes >= start - TRAYECTO_MARGIN_MIN && nowMinutes <= start) return true;
  }

  // Tarde: igual.
  if (student.route_afternoon_pickup && student.route_afternoon_arrival) {
    const start = toMinutes(student.route_afternoon_pickup);
    const end = toMinutes(student.route_afternoon_arrival);
    if (nowMinutes >= start && nowMinutes <= end) return true;
  } else if (student.school_end_time) {
    const end = toMinutes(student.school_end_time);
    if (nowMinutes >= end && nowMinutes <= end + TRAYECTO_MARGIN_MIN) return true;
  }

  return false;
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
        student: {
          select: {
            route_morning_pickup: true, route_morning_arrival: true,
            route_afternoon_pickup: true, route_afternoon_arrival: true,
            school: { select: { school_start_time: true, school_end_time: true } },
          },
        },
      },
    });

    const now = new Date();
    let activated = 0;
    for (const tracker of trackers) {
      const student = tracker.student;
      if (!student) continue;

      const inWindow = isInCommuteWindow(now, {
        route_morning_pickup: student.route_morning_pickup,
        route_morning_arrival: student.route_morning_arrival,
        route_afternoon_pickup: student.route_afternoon_pickup,
        route_afternoon_arrival: student.route_afternoon_arrival,
        school_start_time: student.school?.school_start_time ?? null,
        school_end_time: student.school?.school_end_time ?? null,
      });

      const platformTrackerId = tracker.platform_tracker_id!;
      if (inWindow) {
        await Promise.all([
          gpsPlatform.activateRouteTracking(tracker.platform_route_id!, platformTrackerId, ACTIVATION_MINUTES),
          gpsPlatform.setReportInterval(platformTrackerId, FAST_REPORT_INTERVAL_SECONDS),
        ]).catch((err) => captureError(err, 'cron', { platformTrackerId }));
        activated++;
      } else {
        await gpsPlatform
          .setReportInterval(platformTrackerId, NORMAL_REPORT_INTERVAL_SECONDS)
          .catch((err) => captureError(err, 'cron', { platformTrackerId }));
      }
    }

    if (activated > 0) console.log(`${label} Ventana de trayecto activa para ${activated} tarjeta(s)`);
  } catch (err) {
    captureError(err, 'cron');
  }
}
