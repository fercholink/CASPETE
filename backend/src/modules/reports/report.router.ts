import { Router } from 'express';
import { summary } from './report.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/reports/summary — métricas del colegio (admin) o global (super_admin)
router.get('/summary', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), summary);

export default router;
