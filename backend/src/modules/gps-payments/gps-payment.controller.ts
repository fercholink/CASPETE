import type { Request, Response } from 'express';
import * as gpsPaymentService from './gps-payment.service.js';
import { createGpsPaymentSchema, processGpsPaymentSchema } from './gps-payment.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

import * as wompiService from './wompi.service.js';

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

export async function payWithBalance(req: Request, res: Response) {
  const trackerId = req.body.trackerId as string;
  if (!trackerId) {
    return res.status(400).json({ success: false, message: 'trackerId es requerido' });
  }
  const result = await gpsPaymentService.payGpsWithKidwayBalance(trackerId, req.user!);
  sendSuccess(res, result, result.message);
}

export async function createWompiCheckout(req: Request, res: Response) {
  const trackerId = req.body.trackerId as string;
  if (!trackerId) {
    return res.status(400).json({ success: false, message: 'trackerId es requerido' });
  }
  const result = await wompiService.createWompiCheckoutSession(trackerId, req.user!);
  sendSuccess(res, result, 'Sesión de pago Wompi generada');
}

export async function wompiWebhook(req: Request, res: Response) {
  try {
    const result = await wompiService.handleWompiWebhook(req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Wompi Webhook Error]:', err);
    return res.status(400).json({ success: false, message: err.message || 'Error en webhook' });
  }
}

export async function verifyWompiStatus(req: Request, res: Response) {
  const reference = req.params['reference'] as string;
  const result = await wompiService.checkWompiPaymentStatus(reference, req.user!);
  sendSuccess(res, result);
}

