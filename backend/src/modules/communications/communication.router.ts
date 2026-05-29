import { Router } from 'express';
import * as communicationController from './communication.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allAcademicRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT');

// GET    /api/communications — List messages (defaults to inbox, or box=outbox)
router.get('/', allAcademicRoles, communicationController.list);

// GET    /api/communications/:id — Retrieve single message (and mark as read if inbox)
router.get('/:id', allAcademicRoles, communicationController.getOne);

// POST   /api/communications — Compose/send a message
router.post('/', allAcademicRoles, communicationController.create);

// PUT    /api/communications/:id/read — Mark message as read
router.put('/:id/read', allAcademicRoles, communicationController.markAsRead);

// DELETE /api/communications/:id — Delete a message
router.delete('/:id', allAcademicRoles, communicationController.deleteOne);

export default router;
