import type { Request, Response } from 'express';
import * as gpsPaymentService from './gps-payment.service.js';
import { createGpsPaymentSchema, processGpsPaymentSchema } from './gps-payment.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createGpsPaymentSchema.parse(req.body);
  const result = await gpsPaymentService.createGpsPaymentRequest(input, req.user!);
  sendSuccess(res, result, 'Comprobante enviado — será validado pronto', 201);
}

export async function list(req: Request, res: Response) {
  const page = Number(req.query['page']) || undefined;
  const limit = Number(req.query['limit']) || undefined;
  const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
  const result = await gpsPaymentService.listGpsPaymentRequests(req.user!, { ...(status !== undefined && { status }), ...(page !== undefined && { page }), ...(limit !== undefined && { limit }) });
  sendSuccess(res, result);
}

export async function status(req: Request, res: Response) {
  const trackerId = req.params['trackerId'] as string;
  const result = await gpsPaymentService.getGpsSubscriptionStatus(trackerId, req.user!);
  sendSuccess(res, result);
}

export async function process(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = processGpsPaymentSchema.parse(req.body);
  const result = await gpsPaymentService.processGpsPaymentRequest(id, input.action, req.user!);
  sendSuccess(res, result, `Pago ${input.action === 'APPROVED' ? 'aprobado' : 'rechazado'}`);
}
