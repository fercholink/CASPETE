import { Router } from 'express';
import * as topupController from './topup-request.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const adminRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET  /api/topup-requests/nequi-available — ¿está configurado Nequi?
router.get('/nequi-available', allRoles, topupController.nequiAvailability);

// GET  /api/topup-requests/stats
router.get('/stats', allRoles, topupController.getStats);

// POST /api/topup-requests/nequi — iniciar pago push Nequi
router.post('/nequi', requireRole('PARENT'), topupController.createNequi);

// GET  /api/topup-requests/:id/nequi-status — polling estado Nequi
router.get('/:id/nequi-status', allRoles, topupController.checkNequi);

// POST /api/topup-requests — recarga manual (transferencia)
router.post('/', requireRole('PARENT'), topupController.create);

// GET  /api/topup-requests — listar solicitudes
router.get('/', allRoles, topupController.list);

// POST /api/topup-requests/:id/process — aprobar/rechazar (admin)
router.post('/:id/process', adminRoles, topupController.processRequest);

export default router;
