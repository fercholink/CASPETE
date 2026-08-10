/**
 * KIDWAY — Scheduler de tareas programadas (Cron Jobs)
 * ───────────────────────────────────────────────────────
 * Centraliza todos los jobs del sistema.
 * Se inicializa una sola vez al arrancar el servidor.
 *
 * Zona horaria: America/Bogota (UTC-5)
 *
 * Jobs registrados:
 *  • anonymize-users    → Diario 02:00 — Ley 1581/2012 Art. 15
 *  • cleanup-tokens     → Diario 03:00 — Higiene de BD
 *  • db-backup          → Diario 04:00 — Respaldo a S3
 */

import cron from 'node-cron';
import { runAnonymizeUsersJob } from './anonymize-users.job.js';
import { runCleanupTokensJob } from './cleanup-tokens.job.js';
import { runDatabaseBackupJob } from './backup-database.job.js';
import { runPollGpsEventsJob } from './poll-gps-events.job.js';
import { runActivateRouteTrackingJob } from './activate-route-tracking.job.js';
import { runGpsSubscriptionReminderJob } from './gps-subscription-reminder.job.js';

const TIMEZONE = 'America/Bogota';

export function initCronJobs(): void {
  console.log('[CRON] Inicializando scheduler de tareas programadas...');

  // ── Job 1: Anonimización de usuarios (Ley 1581/2012 — Art. 15) ──────────
  // Ejecuta cada día a las 02:00 AM hora Colombia
  cron.schedule('0 2 * * *', async () => {
    await runAnonymizeUsersJob();
  }, {
    timezone: TIMEZONE,
  });
  console.log('[CRON] ✅ anonymize-users    → todos los días a las 02:00 (Bogotá)');

  // ── Job 2: Limpieza de tokens y OTPs expirados ──────────────────────────
  // Ejecuta cada día a las 03:00 AM hora Colombia
  cron.schedule('0 3 * * *', async () => {
    await runCleanupTokensJob();
  }, {
    timezone: TIMEZONE,
  });
  console.log('[CRON] ✅ cleanup-tokens     → todos los días a las 03:00 (Bogotá)');

  // ── Job 3: Respaldo diario de la base de datos a S3 ─────────────────────
  // Ejecuta cada día a las 04:00 AM hora Colombia
  cron.schedule('0 4 * * *', async () => {
    await runDatabaseBackupJob();
  }, {
    timezone: TIMEZONE,
  });
  console.log('[CRON] ✅ db-backup          → todos los días a las 04:00 (Bogotá)');

  // ── Job 4: Polling de eventos de geocerca de la Plataforma GPS ─────────
  // Ejecuta cada 2 minutos — notifica al padre cuando su hijo llega/sale del colegio
  cron.schedule('*/2 * * * *', async () => {
    await runPollGpsEventsJob();
  });
  console.log('[CRON] ✅ poll-gps-events    → cada 2 minutos');

  // ── Job 5: Activación de la ventana de trayecto (georuta) ──────────────
  // Ejecuta cada 5 minutos — renueva la evaluación de desviación de ruta
  // mientras el estudiante esté en horario de trayecto (antes/después del colegio)
  cron.schedule('*/5 * * * *', async () => {
    await runActivateRouteTrackingJob();
  });
  console.log('[CRON] ✅ activate-route-tracking → cada 5 minutos');

  // ── Job 6: Recordatorio de mensualidad del plan "solo localizar y llamar" ──
  // Ejecuta cada día a las 09:00 AM hora Colombia
  cron.schedule('0 9 * * *', async () => {
    await runGpsSubscriptionReminderJob();
  }, {
    timezone: TIMEZONE,
  });
  console.log('[CRON] ✅ gps-subscription-reminder → todos los días a las 09:00 (Bogotá)');

  console.log('[CRON] Scheduler activo. Todos los jobs programados correctamente.');
}
