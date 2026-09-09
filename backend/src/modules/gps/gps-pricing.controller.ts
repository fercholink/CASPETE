import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as gpsPricingService from './gps-pricing.service.js';
import { UpdateGpsPricingSchema } from './gps-pricing.service.js';

export async function getPricing(_req: Request, res: Response) {
  const result = await gpsPricingService.getGpsGlobalPricing();
  sendSuccess(res, result);
}

export async function updatePricing(req: Request, res: Response) {
  const input = UpdateGpsPricingSchema.parse(req.body);
  const result = await gpsPricingService.updateGpsGlobalPricing(input, req.user!);
  sendSuccess(res, result, 'Tarifas globales de GPS actualizadas exitosamente');
}
