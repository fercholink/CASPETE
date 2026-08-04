import type { Request, Response } from 'express';
import * as chargeService from './supplier-charge.service.js';
import { generateChargesSchema } from './supplier-charge.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function generate(req: Request, res: Response) {
  const input = generateChargesSchema.parse(req.body);
  const result = await chargeService.generateMonthlyCharges(input.period, req.user!);
  sendSuccess(res, result, 'Cobros generados', 201);
}

export async function list(req: Request, res: Response) {
  const page  = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const opts: { page: number; limit: number; supplier_id?: string; status?: string; period?: string } = { page, limit };
  if (typeof req.query['supplier_id'] === 'string') opts.supplier_id = req.query['supplier_id'];
  if (typeof req.query['status'] === 'string') opts.status = req.query['status'];
  if (typeof req.query['period'] === 'string') opts.period = req.query['period'];
  const result = await chargeService.listCharges(req.user!, opts);
  sendSuccess(res, result);
}

export async function markPaid(req: Request, res: Response) {
  const charge = await chargeService.markChargePaid(req.params['id'] as string, req.user!);
  sendSuccess(res, charge, 'Cobro marcado como pagado');
}

export async function cancel(req: Request, res: Response) {
  const charge = await chargeService.cancelCharge(req.params['id'] as string, req.user!);
  sendSuccess(res, charge, 'Cobro cancelado');
}

export async function stats(req: Request, res: Response) {
  const result = await chargeService.getChargeStats(req.user!);
  sendSuccess(res, result);
}
