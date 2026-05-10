import { Router } from 'express';
import * as storeController from './store.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const canWrite = requireRole('VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET    /api/stores/stats  — estadísticas generales
router.get('/stats', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), storeController.getStats);

// POST   /api/stores
router.post('/', canWrite, storeController.create);

// GET    /api/stores?school_id=&search=&active=&page=&limit=
router.get('/', allRoles, storeController.list);

// GET    /api/stores/:id
router.get('/:id', allRoles, storeController.getOne);

// PATCH  /api/stores/:id
router.patch('/:id', canWrite, storeController.update);

// PATCH  /api/stores/:id/reactivate
router.patch('/:id/reactivate', canWrite, storeController.reactivate);

// DELETE /api/stores/:id  — soft delete
router.delete('/:id', canWrite, storeController.deactivate);

// DELETE /api/stores/:id/permanent — eliminar permanentemente (solo SUPER_ADMIN)
router.delete('/:id/permanent', requireRole('SUPER_ADMIN'), storeController.deleteOne);

export default router;
