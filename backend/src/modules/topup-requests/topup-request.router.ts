import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as topupController from './topup-request.controller.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

function webhookAuth(req: Request, _res: Response, next: NextFunction) {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== env.N8N_WEBHOOK_SECRET)
    throw new AppError('No autorizado', 401);
  next();
}

const router = Router();

// POST /api/topup-requests/confirm — solo n8n puede llamar este endpoint (API key en header)
router.post('/confirm', webhookAuth, topupController.confirm);

router.use(authenticate);

router.post('/', topupController.create);
router.get('/', topupController.list);
router.post('/:id/process', topupController.processRequest);

export default router;
