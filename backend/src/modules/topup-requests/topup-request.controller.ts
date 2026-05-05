import type { Request, Response } from 'express';
import * as topupService from './topup-request.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { z } from 'zod';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const createSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  receiptUrl: z.string().min(1),
});

const confirmSchema = z.object({
  studentId: z.string().uuid('studentId debe ser un UUID válido'),
  amount: z.number().positive('El monto debe ser positivo').max(10_000_000),
  paymentMethod: z.enum(['NEQUI', 'BANCOLOMBIA', 'DAVIVIENDA']),
  gatewayRef: z.string().min(1).max(200),
});

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const result = await topupService.createTopupRequest(input, req.user as JwtPayload);
  sendSuccess(res, result, 'Solicitud enviada correctamente', 201);
}

export async function list(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const result = await topupService.listTopupRequests(req.user as JwtPayload, status);
  sendSuccess(res, result);
}

const processSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});

export async function processRequest(req: Request, res: Response) {
  const input = processSchema.parse(req.body);
  const id = req.params['id'] as string;
  const result = await topupService.processTopupRequest(id, input.action, req.user as JwtPayload);
  sendSuccess(res, result, 'Solicitud procesada');
}

export async function confirm(req: Request, res: Response) {
  const input = confirmSchema.parse(req.body);
  const result = await topupService.confirmTopup(input);
  sendSuccess(res, result, 'Saldo recargado exitosamente');
}
