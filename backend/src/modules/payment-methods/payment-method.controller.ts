import type { Request, Response } from 'express';
import * as pmService from './payment-method.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { z } from 'zod';

const fieldSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(200),
});

const createSchema = z.object({
  key: z.string().min(1).max(30).toUpperCase(),
  label: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
  color: z.string().min(4).max(20),
  fields: z.array(fieldSchema).min(1),
  sort_order: z.number().int().optional(),
});

const updateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().min(4).max(20).optional(),
  fields: z.array(fieldSchema).min(1).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

/** GET /api/payment-methods — lista activos (público autenticado) */
export async function listActive(_req: Request, res: Response) {
  const data = await pmService.listActive();
  sendSuccess(res, data);
}

/** GET /api/payment-methods/all — lista todos (admin) */
export async function listAll(_req: Request, res: Response) {
  const data = await pmService.listAll();
  sendSuccess(res, data);
}

/** GET /api/payment-methods/:id */
export async function getOne(req: Request, res: Response) {
  const data = await pmService.getById(req.params['id']!);
  sendSuccess(res, data);
}

/** POST /api/payment-methods */
export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const data = await pmService.create(input);
  sendSuccess(res, data, 'Método de pago creado', 201);
}

/** PUT /api/payment-methods/:id */
export async function update(req: Request, res: Response) {
  const input = updateSchema.parse(req.body);
  const data = await pmService.update(req.params['id']!, input);
  sendSuccess(res, data, 'Método de pago actualizado');
}

/** DELETE /api/payment-methods/:id */
export async function remove(req: Request, res: Response) {
  const data = await pmService.remove(req.params['id']!);
  sendSuccess(res, data, 'Método de pago eliminado');
}
