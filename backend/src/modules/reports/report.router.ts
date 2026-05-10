import { Router } from 'express';
import * as reportController from './report.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/reports/summary — métricas del colegio (SCHOOL_ADMIN) o global (SUPER_ADMIN)
router.get('/summary', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), reportController.summary);

// GET /api/reports/global — métricas globales del sistema (SUPER_ADMIN only)
router.get('/global', requireRole('SUPER_ADMIN'), reportController.globalStats);

// GET /api/reports/parent — resumen para padres
router.get('/parent', requireRole('PARENT'), reportController.parentSummary);

// GET /api/reports/vendor — resumen para vendors
router.get('/vendor', requireRole('VENDOR'), reportController.vendorSummary);

export default router;
