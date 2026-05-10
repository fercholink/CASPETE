import type { Request, Response, NextFunction } from 'express';
import * as pushService from './push.service.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

/** GET /api/push/vapid-key */
export async function getVapidKey(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ data: pushService.getVapidPublicKey() });
  } catch (e) { next(e); }
}

/** POST /api/push/subscribe */
export async function subscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = (req as Request & { user: JwtPayload }).user;
    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }
    await pushService.saveSubscription(actor.sub, { endpoint, keys });
    res.status(201).json({ data: { ok: true } });
  } catch (e) { next(e); }
}

/** DELETE /api/push/subscribe */
export async function unsubscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = (req as Request & { user: JwtPayload }).user;
    const { endpoint } = req.body as { endpoint: string };
    if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });
    await pushService.deleteSubscription(actor.sub, endpoint);
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
}
