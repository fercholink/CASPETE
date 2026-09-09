import { Router } from 'express';
import * as gpsPaymentController from './gps-payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

// POST /api/gps-payments/wompi/webhook — notificación de eventos Wompi (público con checksum interno)
router.post('/wompi/webhook', gpsPaymentController.wompiWebhook);

// Rutas protegidas que requieren autenticación
router.use(authenticate);

// POST /api/gps-payments/pay-with-balance — pago mensual con débito de saldo Kidway
router.post('/pay-with-balance', requireRole('PARENT'), gpsPaymentController.payWithBalance);

// POST /api/gps-payments/wompi/checkout — iniciar pago en línea con Wompi (Tarjeta / PSE)
router.post('/wompi/checkout', requireRole('PARENT'), gpsPaymentController.createWompiCheckout);

// GET  /api/gps-payments/wompi/verify/:reference — consultar estado de referencia Wompi
router.get('/wompi/verify/:reference', requireRole('PARENT', 'SUPER_ADMIN'), gpsPaymentController.verifyWompiStatus);

// POST /api/gps-payments — enviar comprobante de transferencia bancaria
router.post('/', requireRole('PARENT'), gpsPaymentController.create);

// GET  /api/gps-payments — listar (padre ve las suyas, SUPER_ADMIN ve todas)
router.get('/', requireRole('PARENT', 'SUPER_ADMIN'), gpsPaymentController.list);

// GET  /api/gps-payments/trackers/:trackerId/status — estado del plan (comprado/al día y desglose)
router.get('/trackers/:trackerId/status', requireRole('PARENT', 'SUPER_ADMIN'), gpsPaymentController.status);

// POST /api/gps-payments/:id/process — aprobar/rechazar (solo SUPER_ADMIN)
router.post('/:id/process', requireRole('SUPER_ADMIN'), gpsPaymentController.process);

export default router;

