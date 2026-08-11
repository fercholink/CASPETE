import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { leadsLimiter } from '../../middleware/rate-limit.middleware.js';
import { getClientIp } from '../../utils/ip.js';
import * as orders from './gps-device-order.service.js';
import { CreateGpsDeviceOrderSchema, UpdateGpsDeviceOrderSchema } from './gps-device-order.schemas.js';

const router = Router();

// ── POST /api/gps-device-orders — Público: el padre paga el dispositivo antes de registrarse ──
router.post('/', leadsLimiter, async (req, res, next) => {
  try {
    const body = CreateGpsDeviceOrderSchema.parse(req.body);
    const data = await orders.createOrder(body, getClientIp(req));
    // Responde éxito siempre, aunque se haya descartado por spam.
    res.status(201).json({ success: true, data: { id: data?.id ?? null } });
  } catch (e) { next(e); }
});

// ── GET /api/gps-device-orders — SUPER_ADMIN: ver pedidos pendientes de despacho ──
router.get(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data = await orders.listOrders({ page, limit, ...(status !== undefined && { status }) });
      res.json({ success: true, ...data });
    } catch (e) { next(e); }
  },
);

// ── PATCH /api/gps-device-orders/:id — SUPER_ADMIN: aprobar pago / marcar enviado ──
router.patch(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const id = req.params['id'] as string | undefined;
      if (!id) { res.status(400).json({ success: false, error: 'ID requerido' }); return; }
      const body = UpdateGpsDeviceOrderSchema.parse(req.body);
      const data = await orders.updateOrder(id, body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },
);

// ── DELETE /api/gps-device-orders/:id — SUPER_ADMIN: eliminar pedido (prueba/spam) ──
router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const id = req.params['id'] as string | undefined;
      if (!id) { res.status(400).json({ success: false, error: 'ID requerido' }); return; }
      await orders.deleteOrder(id);
      res.json({ success: true });
    } catch (e) { next(e); }
  },
);

export default router;
