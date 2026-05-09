import { Router } from 'express';
import * as txController from './transaction.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/transactions?student_id=  — historial de transacciones de un estudiante
router.get('/', requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), txController.list);

export default router;
