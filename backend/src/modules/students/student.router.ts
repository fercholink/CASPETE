import { Router } from 'express';
import * as studentController from './student.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// POST   /api/students         — registrar estudiante (PARENT)
router.post('/', requireRole('PARENT'), studentController.create);

// GET    /api/students         — listar (PARENT: los propios, SCHOOL_ADMIN: del colegio, SUPER_ADMIN: todos)
router.get('/', allRoles, studentController.list);

// GET    /api/students/:id
router.get('/:id', allRoles, studentController.getOne);

// PATCH  /api/students/:id
router.patch('/:id', requireRole('PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), studentController.update);

// DELETE /api/students/:id     — soft delete
router.delete('/:id', requireRole('PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), studentController.deactivate);

// POST   /api/students/:id/topup — recargar saldo (admin)
router.post('/:id/topup', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), studentController.topup);

// DELETE /api/students/:id/permanent — eliminar permanentemente (solo SUPER_ADMIN)
router.delete('/:id/permanent', requireRole('SUPER_ADMIN'), studentController.deleteOne);

export default router;
