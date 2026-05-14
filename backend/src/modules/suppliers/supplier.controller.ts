import type { Request, Response } from 'express';
import * as supplierService from './supplier.service.js';
import { createSupplierSchema, updateSupplierSchema } from './supplier.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createSupplierSchema.parse(req.body);
  const supplier = await supplierService.createSupplier(input, req.user!);
  sendSuccess(res, supplier, 'Proveedor creado', 201);
}

export async function list(req: Request, res: Response) {
  const page  = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const opts: { page: number; limit: number; expired_only?: string } = { page, limit };
  if (typeof req.query['expired_only'] === 'string') opts.expired_only = req.query['expired_only'];
  const result = await supplierService.listSuppliers(req.user!, opts);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const supplier = await supplierService.getSupplier(req.params['id'] as string, req.user!);
  sendSuccess(res, supplier);
}

export async function update(req: Request, res: Response) {
  const input = updateSupplierSchema.parse(req.body);
  const supplier = await supplierService.updateSupplier(req.params['id'] as string, input, req.user!);
  sendSuccess(res, supplier, 'Proveedor actualizado');
}

export async function remove(req: Request, res: Response) {
  await supplierService.deleteSupplier(req.params['id'] as string, req.user!);
  sendSuccess(res, null, 'Proveedor eliminado');
}

export async function expiredTechSheets(req: Request, res: Response) {
  const suppliers = await supplierService.getExpiredTechSheets(req.user!);
  sendSuccess(res, suppliers);
}
