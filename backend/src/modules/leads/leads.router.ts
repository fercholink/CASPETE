import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { leadsLimiter } from '../../middleware/rate-limit.middleware.js';
import { getClientIp } from '../../utils/ip.js';
import * as leads from './leads.service.js';
import { CreateLeadSchema, AdminCreateLeadSchema, UpdateLeadSchema } from './leads.schemas.js';

const router = Router();

// ── POST /api/leads — Público: colegio interesado desde la landing ────────────
router.post('/', leadsLimiter, async (req, res, next) => {
  try {
    const body = CreateLeadSchema.parse(req.body);
    const data = await leads.createLead(body, getClientIp(req));
    // Responde éxito siempre, aunque se haya descartado por spam — no le damos
    // señal útil a un bot para que ajuste su comportamiento.
    res.status(201).json({ success: true, data: { id: data?.id ?? null } });
  } catch (e) { next(e); }
});

// ── GET /api/leads — SUPER_ADMIN: ver colegios interesados ───────────────────
router.get(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const page   = Number(req.query.page)  || 1;
      const limit  = Number(req.query.limit) || 50;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data = await leads.listLeads({ page, limit, ...(status !== undefined && { status }) });
      res.json({ success: true, ...data });
    } catch (e) { next(e); }
  },
);

// ── POST /api/leads/admin — SUPER_ADMIN: registrar lead manualmente (llamada/WhatsApp) ──
router.post(
  '/admin',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const body = AdminCreateLeadSchema.parse(req.body);
      const data = await leads.createLeadAdmin(body);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },
);

// ── PATCH /api/leads/:id — SUPER_ADMIN: cambiar estado / agregar notas ────────
router.patch(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const id = req.params['id'] as string | undefined;
      if (!id) { res.status(400).json({ success: false, error: 'ID requerido' }); return; }
      const body = UpdateLeadSchema.parse(req.body);
      const data = await leads.updateLead(id, body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },
);

// ── DELETE /api/leads/:id — SUPER_ADMIN: eliminar lead (prueba, duplicado, spam) ──
router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const id = req.params['id'] as string | undefined;
      if (!id) { res.status(400).json({ success: false, error: 'ID requerido' }); return; }
      await leads.deleteLead(id);
      res.json({ success: true });
    } catch (e) { next(e); }
  },
);

export default router;
