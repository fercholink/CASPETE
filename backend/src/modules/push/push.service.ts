import webpush from 'web-push';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

// VAPID keys - generadas con web-push generate-vapid-keys
// Se leen del entorno (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL)
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       ?? 'mailto:info@caspete.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export function getVapidPublicKey() {
  if (!VAPID_PUBLIC) throw new AppError('Web Push no configurado en el servidor', 503);
  return { publicKey: VAPID_PUBLIC };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/** Guarda (o actualiza) la suscripción push del usuario */
export async function saveSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update:  { user_id: userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create:  { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

/** Elimina la suscripción push */
export async function deleteSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { user_id: userId, endpoint } });
}

/** Envía una notificación push a todos los dispositivos de un usuario */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[Push] VAPID no configurado, notificación omitida');
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { user_id: userId } });
  if (subs.length === 0) return;

  const message = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
      ).catch(async (err: { statusCode?: number }) => {
        // 410 Gone = suscripción expirada → limpiar BD
        if (err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
        throw err;
      }),
    ),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`[Push] ${failed}/${subs.length} notificaciones fallaron para user ${userId}`);
  }
}
