import { Router } from 'express';
import * as storeProductController from './store-product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

// ─── Rutas anidadas bajo /api/stores/:storeId/products ───
export const storeProductsSubRouter = Router({ mergeParams: true });
storeProductsSubRouter.use(authenticate);

const canManage = requireRole('VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET  /api/stores/:storeId/products
storeProductsSubRouter.get('/', allRoles, storeProductController.listProducts);
// POST /api/stores/:storeId/products
storeProductsSubRouter.post('/', canManage, storeProductController.addProduct);
// POST /api/stores/:storeId/products/bulk
storeProductsSubRouter.post('/bulk', canManage, storeProductController.bulkAdd);

// ─── Rutas directas /api/store-products/:id ───
const storeProductDirectRouter = Router();
storeProductDirectRouter.use(authenticate);

// PATCH  /api/store-products/:id
storeProductDirectRouter.patch('/:id', canManage, storeProductController.update);
// DELETE /api/store-products/:id
storeProductDirectRouter.delete('/:id', canManage, storeProductController.remove);

export default storeProductDirectRouter;
