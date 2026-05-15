/**
 * Job: Anonimización automática de usuarios
 * ─────────────────────────────────────────
 * Ley 1581/2012 — Art. 8 lit. c, Art. 15 (Derecho al Olvido)
 *
 * Ejecuta cada día a las 02:00 AM (hora Colombia, UTC-5).
 * Busca usuarios con `deletion_requested = true` cuya solicitud
 * lleve 30 o más días, y ejecuta la anonimización efectiva.
 */

import { prisma } from '../lib/prisma.js';
import { anonymizeUser } from '../modules/arco/arco.service.js';

const GRACE_PERIOD_DAYS = 30;

export async function runAnonymizeUsersJob(): Promise<void> {
  const label = '[CRON:anonymize-users]';
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  console.log(`${label} Iniciando — buscando solicitudes anteriores a ${cutoff.toISOString()}`);

  try {
    const candidates = await prisma.user.findMany({
      where: {
        deletion_requested: true,
        anonymized: false,
        deletion_requested_at: { lte: cutoff },
      },
      select: { id: true, email: true, deletion_requested_at: true },
    });

    if (candidates.length === 0) {
      console.log(`${label} Sin usuarios para anonimizar hoy.`);
      return;
    }

    console.log(`${label} Encontrados ${candidates.length} usuario(s) para anonimizar.`);

    let success = 0;
    let errors = 0;

    for (const user of candidates) {
      try {
        await anonymizeUser(user.id);
        console.log(`${label} ✅ Anonimizado: ${user.id} (solicitado: ${user.deletion_requested_at?.toISOString()})`);
        success++;
      } catch (err) {
        console.error(`${label} ❌ Error al anonimizar ${user.id}:`, err);
        errors++;
      }
    }

    console.log(`${label} Completado — ${success} exitosos, ${errors} errores.`);
  } catch (err) {
    console.error(`${label} Error crítico en el job:`, err);
  }
}
