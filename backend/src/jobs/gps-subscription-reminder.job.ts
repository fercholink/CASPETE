/**
 * Job: Recordatorio de mensualidad del plan "solo localizar y llamar"
 * ──────────────────────────────────────────────────────────────────
 * Ejecuta una vez al día. Para trackers de un colegio placeholder
 * (School.is_gps_only) que ya compraron el dispositivo, notifica al padre
 * por push si la mensualidad vence en los próximos 3 días o ya venció —
 * el rastreo se suspende automáticamente al vencer (ver isTelemetryAllowed
 * en gps.service.ts), este job solo avisa para que no los tome por sorpresa.
 */
import { prisma } from '../lib/prisma.js';
import { captureError } from '../lib/monitoring.js';
import * as pushService from '../modules/push/push.service.js';

const REMINDER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

export async function runGpsSubscriptionReminderJob(): Promise<void> {
  const label = '[CRON:gps-subscription-reminder]';
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const trackers = await prisma.gPSTracker.findMany({
      where: {
        device_purchased: true,
        active: true,
        student: { school: { is_gps_only: true } },
        OR: [
          { subscription_paid_until: null },
          { subscription_paid_until: { lt: windowEnd } },
        ],
      },
      select: {
        id: true,
        subscription_paid_until: true,
        student: { select: { full_name: true, parent_id: true } },
      },
    });

    for (const tracker of trackers) {
      if (!tracker.student) continue;
      const overdue = !tracker.subscription_paid_until || tracker.subscription_paid_until < now;
      const title = overdue
        ? `⏸ El plan GPS de ${tracker.student.full_name} está vencido`
        : `⏰ El plan GPS de ${tracker.student.full_name} vence pronto`;
      const body = overdue
        ? 'El rastreo y las llamadas están en pausa hasta que renueves la mensualidad ($25.000).'
        : 'Renueva la mensualidad ($25.000) para no perder el rastreo ni las llamadas.';

      await pushService
        .sendPushToUser(tracker.student.parent_id, { title, body, tag: 'gps-subscription' })
        .catch((err) => captureError(err, 'cron', { trackerId: tracker.id }));
    }

    if (trackers.length > 0) {
      console.log(`${label} ${trackers.length} recordatorio(s) enviado(s)`);
    }
  } catch (err) {
    captureError(err, 'cron');
  }
}
