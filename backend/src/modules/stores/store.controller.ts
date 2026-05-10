import type { Request, Response } from 'express';
import * as storeService from './store.service.js';
import { createStoreSchema, updateStoreSchema } from './store.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createStoreSchema.parse(req.body);
  const store = await storeService.createStore(input, req.user!);
  sendSuccess(res, store, 'Tienda creada', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const search = req.query['search'] as string | undefined;
  const school_id = req.query['school_id'] as string | undefined;
  const active = req.query['active'] as string | undefined;
  const result = await storeService.listStores(req.user!, { page, limit, search, school_id, active });
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const store = await storeService.getStore(id);
  sendSuccess(res, store);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateStoreSchema.parse(req.body);
  const store = await storeService.updateStore(id, input, req.user!);
  sendSuccess(res, store, 'Tienda actualizada');
}

export async function deactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const store = await storeService.deactivateStore(id, req.user!);
  sendSuccess(res, store, 'Tienda desactivada');
}

export async function reactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const store = await storeService.reactivateStore(id, req.user!);
  sendSuccess(res, store, 'Tienda reactivada');
}

export async function getStats(req: Request, res: Response) {
  const stats = await storeService.getStoreStats(req.user!);
  sendSuccess(res, stats);
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await storeService.deleteStore(id, req.user!);
  sendSuccess(res, null, 'Tienda eliminada permanentemente');
}
