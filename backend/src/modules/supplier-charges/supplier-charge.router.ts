import { Router } from 'express';
import * as chargeController from './supplier-charge.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const superOnly = requireRole('SUPER_ADMIN');

// GET  /api/supplier-charges/stats
router.get('/stats', superOnly, chargeController.stats);

// POST /api/supplier-charges/generate — { period: "YYYY-MM" }
router.post('/generate', superOnly, chargeController.generate);

// GET  /api/supplier-charges
router.get('/', superOnly, chargeController.list);

// POST /api/supplier-charges/:id/pay
router.post('/:id/pay', superOnly, chargeController.markPaid);

// POST /api/supplier-charges/:id/cancel
router.post('/:id/cancel', superOnly, chargeController.cancel);

export default router;
