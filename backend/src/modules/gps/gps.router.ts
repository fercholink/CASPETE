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
router.patch('/trackers/:id/emergency-contacts', gpsRoles, gpsController.setEmergencyContacts);
router.patch('/trackers/:id/phone-number', gpsRoles, gpsController.setPhoneNumber);
router.patch('/trackers/:id/find', gpsRoles, gpsController.findDevice);
router.patch('/trackers/:id/power', gpsRoles, gpsController.sendPowerAction);
router.patch('/trackers/:id/alarm-clock', gpsRoles, gpsController.setAlarmClock);
router.get('/trackers/student/:studentId', gpsRoles, gpsController.getCurrentLocation);
router.get('/trackers/student/:studentId/history', gpsRoles, gpsController.getHistory);
router.get('/trackers/student/:studentId/route', gpsRoles, gpsController.getExpectedRoute);
router.post('/trackers/student/:studentId/save-route-from-history', gpsRoles, gpsController.saveRouteFromHistory);

export default router;
