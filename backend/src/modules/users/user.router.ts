import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const adminRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

// POST   /api/users               — admin crea cuenta de VENDOR/SCHOOL_ADMIN
router.post('/', adminRoles, userController.create);

// GET    /api/users               — listar usuarios del colegio
router.get('/', adminRoles, userController.list);

// GET    /api/users/:id
router.get('/:id', adminRoles, userController.getOne);

// PATCH  /api/users/:id           — actualizar nombre / teléfono / estado
router.patch('/:id', adminRoles, userController.update);

// DELETE /api/users/:id           — desactivar (admin colegio)
router.delete('/:id', adminRoles, userController.deactivate);

// DELETE /api/users/:id/permanent — eliminar permanentemente (solo SUPER_ADMIN)
router.delete('/:id/permanent', requireRole('SUPER_ADMIN'), userController.deleteOne);

export default router;
