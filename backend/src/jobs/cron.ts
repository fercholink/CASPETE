/**
 * CASPETE — Scheduler de tareas programadas (Cron Jobs)
 * ───────────────────────────────────────────────────────
 * Centraliza todos los jobs del sistema.
 * Se inicializa una sola vez al arrancar el servidor.
 *
 * Zona horaria: America/Bogota (UTC-5)
 *
 * Jobs registrados:
 *  • anonymize-users    → Diario 02:00 — Ley 1581/2012 Art. 15
 *  • cleanup-tokens     → Diario 03:00 — Higiene de BD
 */

import cron from 'node-cron';
import { runAnonymizeUsersJob } from './anonymize-users.job.js';
import { runCleanupTokensJob } from './cleanup-tokens.job.js';

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

  console.log('[CRON] Scheduler activo. Todos los jobs programados correctamente.');
}
