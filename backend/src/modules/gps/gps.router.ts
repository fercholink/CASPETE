import { Router } from 'express';
import * as gpsController from './gps.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// Acceso exclusivo del padre dueño del estudiante (o SUPER_ADMIN para soporte, con auditoría).
// SCHOOL_ADMIN, VENDOR y TEACHER no tienen ningún endpoint de ubicación GPS.
const gpsRoles = requireRole('PARENT', 'SUPER_ADMIN');

router.post('/trackers', gpsRoles, gpsController.link);
router.delete('/trackers/:id', gpsRoles, gpsController.unlink);
router.get('/trackers/student/:studentId', gpsRoles, gpsController.getCurrentLocation);
router.get('/trackers/student/:studentId/history', gpsRoles, gpsController.getHistory);

export default router;
