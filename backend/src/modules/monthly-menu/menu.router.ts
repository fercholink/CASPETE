import { Router } from 'express';
import * as menuController from './menu.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER');
const adminRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET    /api/monthly-menu/:schoolId?month=&year=  — ver el menú del mes
router.get('/:schoolId', allRoles, menuController.listMonth);

// PUT    /api/monthly-menu/:schoolId/:date  — crear/editar el menú de un día (YYYY-MM-DD)
router.put('/:schoolId/:date', adminRoles, menuController.upsertDay);

// DELETE /api/monthly-menu/:schoolId/:date  — eliminar el menú de un día
router.delete('/:schoolId/:date', adminRoles, menuController.deleteDay);

export default router;
