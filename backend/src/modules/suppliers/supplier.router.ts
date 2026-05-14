import { Router } from 'express';
import * as supplierController from './supplier.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const adminRoles = requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN');
const superOnly  = requireRole('SUPER_ADMIN');

// GET /api/suppliers/expired-tech-sheets  → fichas vencidas >12 meses (KPI Ley 2120)
router.get('/expired-tech-sheets', adminRoles, supplierController.expiredTechSheets);

router.get('/',    adminRoles, supplierController.list);
router.get('/:id', adminRoles, supplierController.getOne);
router.post('/',   adminRoles, supplierController.create);
router.patch('/:id', adminRoles, supplierController.update);
router.delete('/:id', superOnly, supplierController.remove);

export default router;
