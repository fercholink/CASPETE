import { Router } from 'express';
import * as geofenceController from './gps-geofence.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate);

// Geocercas "libres" (zonas adicionales, no la automática 1:1 con un colegio)
// — solo SUPER_ADMIN, requiere dibujar en un mapa y entender el impacto.
const superAdminOnly = requireRole('SUPER_ADMIN');

router.post('/', superAdminOnly, geofenceController.create);
router.get('/', superAdminOnly, geofenceController.list);
router.get('/:id', superAdminOnly, geofenceController.getOne);
router.patch('/:id', superAdminOnly, geofenceController.update);
router.delete('/:id', superAdminOnly, geofenceController.remove);
router.post('/:id/trackers', superAdminOnly, geofenceController.linkTracker);
router.delete('/:id/trackers/:trackerId', superAdminOnly, geofenceController.unlinkTracker);

export default router;
