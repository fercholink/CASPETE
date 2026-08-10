import { Router } from 'express';
import * as gpsPaymentController from './gps-payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// POST /api/gps-payments — enviar comprobante (dispositivo o mensualidad)
router.post('/', requireRole('PARENT'), gpsPaymentController.create);

// GET  /api/gps-payments — listar (padre ve las suyas, SUPER_ADMIN ve todas)
router.get('/', requireRole('PARENT', 'SUPER_ADMIN'), gpsPaymentController.list);

// GET  /api/gps-payments/trackers/:trackerId/status — estado del plan (comprado/al día)
router.get('/trackers/:trackerId/status', requireRole('PARENT', 'SUPER_ADMIN'), gpsPaymentController.status);

// POST /api/gps-payments/:id/process — aprobar/rechazar (solo SUPER_ADMIN)
router.post('/:id/process', requireRole('SUPER_ADMIN'), gpsPaymentController.process);

export default router;
