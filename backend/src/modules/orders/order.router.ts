import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { deliveryLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();
router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const adminRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

// POST   /api/orders                         — crear pedido (PARENT)
router.post('/', requireRole('PARENT'), orderController.create);

// GET    /api/orders?status=                 — listar pedidos (por rol)
router.get('/', allRoles, orderController.list);

// GET    /api/orders/:id                     — detalle con OTP para PARENT
router.get('/:id', allRoles, orderController.getOne);

// PATCH  /api/orders/:id/confirm             — confirmar (admin)
router.patch('/:id/confirm', adminRoles, orderController.confirm);

// PATCH  /api/orders/:id/cancel              — cancelar
router.patch('/:id/cancel', allRoles, orderController.cancel);

// POST   /api/orders/:id/deliver             — entregar con OTP (VENDOR)
router.post('/:id/deliver', deliveryLimiter, requireRole('VENDOR'), orderController.deliver);

// POST   /api/orders/bulk-confirm?scheduled_date= — confirmar todos los PENDING (admin)
router.post('/bulk-confirm', adminRoles, orderController.bulkConfirm);

// POST   /api/orders/topup/:studentId        — recargar saldo (admin)
router.post('/topup/:studentId', adminRoles, orderController.topup);

export default router;
