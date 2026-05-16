import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { listProductNutritionalHistory } from './nutritional-audit.service.js';

export const nutritionalAuditRouter = Router();

/**
 * GET /api/products/:id/nutritional-history
 * Historial de cambios nutricionales de un producto (SUPER_ADMIN).
 * Brecha #7 — trazabilidad Art. 29 Res. 2492/2022
 */
nutritionalAuditRouter.get(
  '/products/:id/nutritional-history',
  authenticate,
  async (req, res, next) => {
    try {
      const history = await listProductNutritionalHistory(req.params.id as string, req.user!);
      res.json({ data: history });
    } catch (err) {
      next(err);
    }
  },
);
