import { Router } from 'express';
import * as pmController from './payment-method.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// Público (autenticado) — devuelve solo activos
router.get('/', pmController.listActive);

// Admin
router.get('/all', requireRole('SUPER_ADMIN'), pmController.listAll);
router.get('/:id', requireRole('SUPER_ADMIN'), pmController.getOne);
router.post('/', requireRole('SUPER_ADMIN'), pmController.create);
router.put('/:id', requireRole('SUPER_ADMIN'), pmController.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), pmController.remove);

export default router;
