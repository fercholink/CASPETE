import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as arco from './arco.service.js';

const router = Router();

// ── GET /api/arco/my-data — Derecho de Acceso (Art. 13) ─────────────────────
router.get('/my-data', authenticate, async (req, res, next) => {
  try {
    const data = await arco.getMyData(req.user!.sub, req);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── PATCH /api/arco/privacy-toggles — Derecho de Oposición (Art. 13.c) ─────
router.patch('/privacy-toggles', authenticate, async (req, res, next) => {
  try {
    const body = req.body as { allow_analytics?: boolean; allow_marketing?: boolean };
    const toggles: { allow_analytics?: boolean; allow_marketing?: boolean } = {};
    if (typeof body.allow_analytics === 'boolean') toggles.allow_analytics = body.allow_analytics;
    if (typeof body.allow_marketing === 'boolean') toggles.allow_marketing = body.allow_marketing;
    const updated = await arco.updatePrivacyToggles(req.user!.sub, toggles, req);
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// ── POST /api/arco/request-deletion — Derecho al Olvido (Art. 15) ──────────
router.post('/request-deletion', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body as { reason?: string };
    const result = await arco.requestDeletion(req.user!.sub, reason ?? 'Sin motivo especificado', req);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// ── DELETE /api/arco/cancel-deletion — Cancelar dentro del periodo de gracia ─
router.delete('/cancel-deletion', authenticate, async (req, res, next) => {
  try {
    const result = await arco.cancelDeletionRequest(req.user!.sub, req);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

export default router;
