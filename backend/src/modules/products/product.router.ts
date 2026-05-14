import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { contentComplianceCheck } from '../../middleware/content-compliance.middleware.js';

const router = Router();
router.use(authenticate);

const allRoles  = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const superOnly = requireRole('SUPER_ADMIN');

// Estadísticas (incluye KPIs de Ley 2120)
router.get('/stats', superOnly, productController.getStats);

// GET  /api/products?seal_free=true  → Filtro "Libre de Sellos" Ley 2120
// GET  /api/products?level=LEVEL_1   → Filtro por nivel nutricional
router.get('/',    allRoles, productController.list);
router.get('/:id', allRoles, productController.getOne);

// GET  /api/products/:id/seals — detalle de sellos (Sección 2.5)
router.get('/:id/seals', allRoles, productController.getSeals);

router.post('/', superOnly, contentComplianceCheck, productController.create);

// PATCH /api/products/:id                — edición general
router.patch('/:id', superOnly, contentComplianceCheck, productController.update);

// PATCH /api/products/:id/nutritional-data — actualiza datos nutricionales y recalcula sellos (Sección 2.5)
router.patch('/:id/nutritional-data', superOnly, productController.updateNutritional);

// POST  /api/products/:id/audit          — registra auditoría nutricional (Sección 2.5)
router.post('/:id/audit', superOnly, productController.audit);

router.patch('/:id/reactivate',  superOnly, productController.reactivate);
router.delete('/:id',            superOnly, productController.deactivate);
router.delete('/:id/permanent',  superOnly, productController.deleteOne);

export default router;
