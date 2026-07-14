import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);
router.use(requireRole('TEACHER'));

// POST /api/attendance/scan — escanea el QR de la tarjeta, marca llegada a clase
router.post('/scan', attendanceController.scan);

// GET /api/attendance/course/:courseId — historial de asistencia del curso
router.get('/course/:courseId', attendanceController.listForCourse);

export default router;
