import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as pushController from './push.controller.js';

const router = Router();

// Clave pública VAPID (sin auth, necesaria para el frontend antes de login)
router.get('/vapid-key', pushController.getVapidKey);

// Requiere auth para suscribirse/cancelar
router.use(authenticate);
router.post('/subscribe',   pushController.subscribe);
router.delete('/subscribe', pushController.unsubscribe);

export default router;
