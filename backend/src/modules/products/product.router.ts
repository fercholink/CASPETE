import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const superOnly = requireRole('SUPER_ADMIN');

// GET    /api/products/stats — estadísticas globales
router.get('/stats', superOnly, productController.getStats);

// GET    /api/products?category=&active=&search=&is_healthy=&page=&limit=
router.get('/', allRoles, productController.list);

// GET    /api/products/:id
router.get('/:id', allRoles, productController.getOne);

// POST   /api/products  — solo SUPER_ADMIN
router.post('/', superOnly, productController.create);

// PATCH  /api/products/:id  — solo SUPER_ADMIN
router.patch('/:id', superOnly, productController.update);

// PATCH  /api/products/:id/reactivate  — reactivar
router.patch('/:id/reactivate', superOnly, productController.reactivate);

// DELETE /api/products/:id  — soft delete (solo SUPER_ADMIN)
router.delete('/:id', superOnly, productController.deactivate);

// DELETE /api/products/:id/permanent — hard delete (solo SUPER_ADMIN)
router.delete('/:id/permanent', superOnly, productController.deleteOne);

export default router;
