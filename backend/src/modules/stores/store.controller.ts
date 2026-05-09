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
  const schoolId = req.query['school_id'] as string | undefined;
  const stores = await storeService.listStores(req.user!, schoolId);
  sendSuccess(res, stores);
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

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await storeService.deleteStore(id, req.user!);
  sendSuccess(res, null, 'Tienda eliminada permanentemente');
}
