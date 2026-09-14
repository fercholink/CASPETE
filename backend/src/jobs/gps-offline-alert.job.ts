/**
 * Job: Alerta de localizador GPS desconectado
 * ─────────────────────────────────────────────
 * Ejecuta una vez al día. Este modelo de dispositivo no tiene contraseña
 * SMS (ver GPS_MODULE.md § Hallazgo de seguridad) — cualquiera con el
 * número de la SIM podría mandarle FACTORY# y borrarle a qué servidor
 * apunta, dejándolo mudo hasta que alguien lo reconfigure manualmente.
 * También puede ser simplemente una batería muerta — en cualquier caso,
 * hoy nadie se entera hasta que el padre reporta "no veo la ubicación".
 *
 * Se avisa por Sentry (mismo canal por correo que ya revisa el SUPER_ADMIN)
 * en vez de montar un canal de notificación nuevo.
 *
 * Ventana 20h-46h en vez de "más de 20h": al correr una vez al día, sin
 * tope superior el mismo dispositivo ya conocido/roto generaría un aviso
 * idéntico cada día indefinidamente. La ventana asegura un solo aviso por
 * caída, sin necesitar una columna nueva en la base de datos para
 * recordar "ya avisado".
 */
import { prisma } from '../lib/prisma.js';
import { captureError } from '../lib/monitoring.js';
import * as gpsPlatform from '../lib/gpsPlatform.js';

const MIN_OFFLINE_MS = 20 * 60 * 60 * 1000; // 20 horas
const MAX_OFFLINE_MS = 46 * 60 * 60 * 1000; // 46 horas

export async function runGpsOfflineAlertJob(): Promise<void> {
  const label = '[CRON:gps-offline-alert]';
  try {
    const trackers = await prisma.gPSTracker.findMany({
      where: { active: true, student_id: { not: null }, platform_tracker_id: { not: null } },
      select: { id: true, device_name: true, platform_tracker_id: true, student: { select: { full_name: true } } },
    });

    const now = Date.now();
    let flagged = 0;

    for (const tracker of trackers) {
      const platform = await gpsPlatform.getTrackerStatus(tracker.platform_tracker_id!).catch(() => null);
      if (!platform?.last_seen_at) continue; // nunca ha conectado — es setup pendiente, no una caída

      const offlineMs = now - new Date(platform.last_seen_at).getTime();
      if (offlineMs < MIN_OFFLINE_MS || offlineMs > MAX_OFFLINE_MS) continue;

      flagged++;
      const hours = Math.round(offlineMs / (60 * 60 * 1000));
      captureError(
        new Error(`Localizador GPS sin reportar hace ${hours}h — revisar si necesita reconfigurarse (SERVER,38.191.208.30,5002#)`),
        'gps-offline-alert',
        { trackerId: tracker.id, studentName: tracker.student?.full_name, deviceName: tracker.device_name },
      );
    }

    if (flagged > 0) console.log(`${label} ${flagged} localizador(es) marcado(s) como posiblemente caído(s)`);
  } catch (err) {
    captureError(err, 'cron');
  }
}
