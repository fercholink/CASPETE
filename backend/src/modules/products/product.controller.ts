import type { Request, Response } from 'express';
import * as productService from './product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  updateNutritionalDataSchema,
} from './product.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input, req.user!);
  sendSuccess(res, product, 'Producto creado', 201);
}

export async function list(req: Request, res: Response) {
  const page  = Math.max(1, Number(req.query['page'])  || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const opts: Record<string, string | number> = { page, limit };
  ['search', 'category', 'active', 'is_healthy', 'level', 'seal_free'].forEach(k => {
    if (typeof req.query[k] === 'string') opts[k] = req.query[k] as string;
  });
  const result = await productService.listProducts(req.user!, opts as never);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const product = await productService.getProduct(req.params['id'] as string);
  sendSuccess(res, product);
}

export async function getSeals(req: Request, res: Response) {
  const seals = await productService.getProductSeals(req.params['id'] as string);
  sendSuccess(res, seals);
}

export async function update(req: Request, res: Response) {
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params['id'] as string, input, req.user!);
  sendSuccess(res, product, 'Producto actualizado');
}

export async function updateNutritional(req: Request, res: Response) {
  const input = updateNutritionalDataSchema.parse(req.body);
  const product = await productService.updateNutritionalData(req.params['id'] as string, input, req.user!);
  sendSuccess(res, product, 'Datos nutricionales actualizados y sellos recalculados');
}

export async function audit(req: Request, res: Response) {
  const input = updateNutritionalDataSchema.parse(req.body);
  const product = await productService.registerAudit(req.params['id'] as string, input, req.user!);
  sendSuccess(res, product, 'Auditoría nutricional registrada');
}

export async function deactivate(req: Request, res: Response) {
  const product = await productService.deactivateProduct(req.params['id'] as string, req.user!);
  sendSuccess(res, product, 'Producto desactivado');
}

export async function reactivate(req: Request, res: Response) {
  const product = await productService.reactivateProduct(req.params['id'] as string, req.user!);
  sendSuccess(res, product, 'Producto reactivado');
}

export async function getStats(req: Request, res: Response) {
  const stats = await productService.getProductStats();
  sendSuccess(res, stats);
}

export async function deleteOne(req: Request, res: Response) {
  await productService.deleteProduct(req.params['id'] as string, req.user!);
  sendSuccess(res, null, 'Producto eliminado permanentemente');
}
