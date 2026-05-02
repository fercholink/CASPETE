import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const canWrite = requireRole('VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// POST   /api/products
router.post('/', canWrite, productController.create);

// GET    /api/products?school_id=
router.get('/', allRoles, productController.list);

// GET    /api/products/:id
router.get('/:id', allRoles, productController.getOne);

// PATCH  /api/products/:id
router.patch('/:id', canWrite, productController.update);

// DELETE /api/products/:id  — soft delete
router.delete('/:id', canWrite, productController.deactivate);

export default router;
