import { Router } from 'express';
import * as gpsController from './gps.controller.js';
import * as guardianController from './guardian.controller.js';
import * as gpsPricingController from './gps-pricing.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

// Endpoint público para consultar tarifas vigentes de GPS (usado por Landing, compras y app)
router.get('/pricing', gpsPricingController.getPricing);

router.use(authenticate);

// Acceso exclusivo del padre dueño del estudiante (o SUPER_ADMIN para soporte, con auditoría).
// SCHOOL_ADMIN, VENDOR y TEACHER no tienen ningún endpoint de ubicación GPS.
const gpsRoles = requireRole('PARENT', 'SUPER_ADMIN');
// Configuración avanzada y administración de precios — solo SUPER_ADMIN
const superAdminOnly = requireRole('SUPER_ADMIN');

// Modificar tarifas globales de GPS — solo Master / SUPER_ADMIN
router.put('/pricing', superAdminOnly, gpsPricingController.updatePricing);

// ── Círculo Familiar y Estudiantes Compartidos ──────────────────────────────
router.get('/shared-students', gpsRoles, guardianController.getMySharedStudents);
router.get('/students/:studentId/plan-summary', gpsRoles, guardianController.getPlanSummary);
router.get('/students/:studentId/guardians', gpsRoles, guardianController.listGuardians);
router.post('/students/:studentId/guardians', gpsRoles, guardianController.enrollGuardian);
router.post('/students/:studentId/guardians/:guardianId/resend', gpsRoles, guardianController.resendInvitation);
router.patch('/students/:studentId/guardians/:guardianId', gpsRoles, guardianController.updateGuardian);
router.delete('/students/:studentId/guardians/:guardianId', gpsRoles, guardianController.deleteGuardian);
router.patch('/trackers/:trackerId/custom-plan', superAdminOnly, guardianController.updateTrackerCustomPlan);

router.post('/trackers', gpsRoles, gpsController.link);
router.delete('/trackers/:id', gpsRoles, gpsController.unlink);
router.patch('/trackers/:id/emergency-contacts', gpsRoles, gpsController.setEmergencyContacts);
router.patch('/trackers/:id/phone-number', gpsRoles, gpsController.setPhoneNumber);
router.patch('/trackers/:id/find', gpsRoles, gpsController.findDevice);
router.patch('/trackers/:id/power', gpsRoles, gpsController.sendPowerAction);
router.patch('/trackers/:id/alarm-clock', gpsRoles, gpsController.setAlarmClock);
router.patch('/trackers/:id/wifi-attendance', gpsRoles, gpsController.setWifiAttendance);
router.patch('/trackers/:id/request-position', gpsRoles, gpsController.requestPosition);
router.patch('/trackers/:id/lbs', superAdminOnly, gpsController.setLbsEnabled);
router.patch('/trackers/:id/speed-threshold', superAdminOnly, gpsController.setSpeedThreshold);
router.patch('/trackers/:id/vibration-alarm', superAdminOnly, gpsController.setVibrationAlarm);
router.get('/trackers/:id/geofences', gpsRoles, gpsController.getTrackerGeofences);
router.get('/trackers/student/:studentId', gpsRoles, gpsController.getCurrentLocation);
router.get('/trackers/student/:studentId/history', gpsRoles, gpsController.getHistory);
router.get('/trackers/student/:studentId/route', gpsRoles, gpsController.getExpectedRoute);
router.post('/trackers/student/:studentId/save-route-from-history', gpsRoles, gpsController.saveRouteFromHistory);

export default router;
