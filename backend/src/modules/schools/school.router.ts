import { Router } from 'express';
import * as schoolController from './school.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// GET    /api/schools/active   — colegios activos para selección (cualquier usuario autenticado)
router.get('/active', schoolController.listActive);

// POST   /api/schools         — crear colegio
router.post('/', requireRole('SUPER_ADMIN'), schoolController.create);

// GET    /api/schools         — listar colegios
router.get('/', requireRole('SUPER_ADMIN'), schoolController.list);

// GET    /api/schools/:id     — ver colegio (SUPER_ADMIN o propio SCHOOL_ADMIN)
router.get('/:id', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), schoolController.getOne);

// PATCH  /api/schools/:id     — actualizar colegio
router.patch('/:id', requireRole('SUPER_ADMIN'), schoolController.update);

// DELETE /api/schools/:id     — desactivar colegio (soft delete)
router.delete('/:id', requireRole('SUPER_ADMIN'), schoolController.deactivate);

export default router;
