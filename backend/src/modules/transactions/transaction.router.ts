import { Router } from 'express';
import * as txController from './transaction.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET /api/transactions/stats?student_id=
router.get('/stats', allRoles, txController.getStats);

// GET /api/transactions?student_id=&page=&limit=&type=
router.get('/', allRoles, txController.list);

export default router;
