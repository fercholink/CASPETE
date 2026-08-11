import { Router } from 'express';
import * as galleryController from './gps-gallery.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

// Público (sin auth) — galería de fotos del localizador en la landing
router.get('/public', galleryController.listActive);

router.use(authenticate);

// Admin
router.get('/', requireRole('SUPER_ADMIN'), galleryController.listAll);
router.post('/', requireRole('SUPER_ADMIN'), galleryController.create);
router.put('/:id', requireRole('SUPER_ADMIN'), galleryController.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), galleryController.remove);

export default router;
