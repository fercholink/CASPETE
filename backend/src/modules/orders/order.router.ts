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

// GET    /api/orders/stats
router.get('/stats', allRoles, orderController.getStats);

// GET    /api/orders?status=                 — listar pedidos (por rol)
router.get('/', allRoles, orderController.list);

// GET    /api/orders/:id                     — detalle con OTP para PARENT
router.get('/:id', allRoles, orderController.getOne);

// PATCH  /api/orders/:id/confirm             — confirmar (admin/vendor)
router.patch('/:id/confirm', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'VENDOR'), orderController.confirm);

// PATCH  /api/orders/:id/cancel              — cancelar
router.patch('/:id/cancel', allRoles, orderController.cancel);

// POST   /api/orders/:id/deliver             — entregar con OTP (VENDOR)
router.post('/:id/deliver', deliveryLimiter, requireRole('VENDOR'), orderController.deliver);

// POST   /api/orders/deliver-student         — entregar pedidos de un estudiante (VENDOR)
router.post('/deliver-student', deliveryLimiter, requireRole('VENDOR'), orderController.deliverStudent);

// POST   /api/orders/bulk-confirm?scheduled_date= — confirmar todos los PENDING (admin/vendor)
router.post('/bulk-confirm', requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'VENDOR'), orderController.bulkConfirm);

// POST   /api/orders/topup/:studentId        — recargar saldo (admin)
router.post('/topup/:studentId', adminRoles, orderController.topup);

// DELETE /api/orders/:id/permanent            — eliminar permanentemente (solo SUPER_ADMIN)
router.delete('/:id/permanent', requireRole('SUPER_ADMIN'), orderController.deleteOne);

export default router;
