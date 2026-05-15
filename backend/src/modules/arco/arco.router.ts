import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as arco from './arco.service.js';
import * as breach from './breach.service.js';

const router = Router();

// ── POST /api/arco/breaches — Registrar brecha de seguridad (SUPER_ADMIN) ───
router.post('/breaches', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const body = req.body as {
      description: string;
      affectedData: string[];
      estimatedAffectedUsers: number;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      remediationActions: string;
    };
    const result = await breach.reportBreach({
      reportedBy: req.user!.email,
      ...body,
    }, req);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// ── GET /api/arco/breaches — Listar brechas registradas (SUPER_ADMIN) ────────
router.get('/breaches', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const data = await breach.listBreaches();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── GET /api/arco/arco-alerts — Alertas ARCO vencidas >10 días (SUPER_ADMIN) ─
router.get('/arco-alerts', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const data = await breach.checkArcoDeadlines();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── POST /api/arco/cookie-consent — Registro consentimiento cookies (público) ─
router.post('/cookie-consent', async (req, res, next) => {
  try {
    const body = req.body as {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      version: string;
      userId?: string;
    };
    const result = await arco.saveCookieConsent(body, req);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// ── GET /api/arco/audit-logs — Panel Compliance SUPER_ADMIN ──────────────────
router.get('/audit-logs', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const q = req.query as {
      page?: string; limit?: string;
      action?: string; entity?: string; userId?: string;
    };
    const data = await arco.getAuditLogs({
      page: parseInt(q.page ?? '1'),
      limit: parseInt(q.limit ?? '50'),
      ...(q.action ? { action: q.action } : {}),
      ...(q.entity ? { entity: q.entity } : {}),
      ...(q.userId ? { userId: q.userId } : {}),
    });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
});

// ── GET /api/arco/arco-requests — Solicitudes ARCO pendientes SUPER_ADMIN ────
router.get('/arco-requests', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const data = await arco.getArcoRequests();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── GET /api/arco/sic-report — Reporte consolidado cumplimiento SIC ───────────
// Ley 1581/2012 Art. 17 lit. f · Decreto 1377/2013 Art. 13 — Solo SUPER_ADMIN
router.get('/sic-report', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const data = await arco.generateSicReport();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});


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
