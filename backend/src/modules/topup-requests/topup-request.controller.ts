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

const nequiSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  phoneNumber: z.string().min(10).max(15),
});

const confirmSchema = z.object({
  studentId: z.string().uuid('studentId debe ser un UUID válido'),
  amount: z.number().positive('El monto debe ser positivo').max(10_000_000),
  paymentMethod: z.enum(['NEQUI', 'BANCOLOMBIA', 'DAVIVIENDA']),
  gatewayRef: z.string().min(1).max(200),
});

const processSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const result = await topupService.createTopupRequest(input, req.user as JwtPayload);
  sendSuccess(res, result, 'Solicitud enviada correctamente', 201);
}

export async function createNequi(req: Request, res: Response) {
  const input = nequiSchema.parse(req.body);
  const result = await topupService.createNequiTopupRequest(
    input.studentId, input.amount, input.phoneNumber, req.user as JwtPayload,
  );
  sendSuccess(res, result, 'Notificación Nequi enviada', 201);
}

export async function checkNequi(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const result = await topupService.checkNequiStatus(id, req.user as JwtPayload);
  sendSuccess(res, result);
}

export async function list(req: Request, res: Response) {
  const status = req.query['status'] as string | undefined;
  const search = req.query['search'] as string | undefined;
  const page = Number(req.query['page']) || 1;
  const limit = Number(req.query['limit']) || 20;
  const result = await topupService.listTopupRequests(req.user as JwtPayload, { status, search, page, limit });
  sendSuccess(res, result);
}

export async function getStats(req: Request, res: Response) {
  const stats = await topupService.getTopupStats(req.user as JwtPayload);
  sendSuccess(res, stats);
}

export async function nequiAvailability(_req: Request, res: Response) {
  const result = await topupService.getNequiAvailability();
  sendSuccess(res, result);
}

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
