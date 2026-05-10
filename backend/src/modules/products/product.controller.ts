import type { Request, Response } from 'express';
import * as productService from './product.service.js';
import { createProductSchema, updateProductSchema } from './product.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input, req.user!);
  sendSuccess(res, product, 'Producto creado', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const opts: { page: number; limit: number; search?: string; category?: string; active?: string; is_healthy?: string } = { page, limit };
  if (typeof req.query['search'] === 'string') opts.search = req.query['search'];
  if (typeof req.query['category'] === 'string') opts.category = req.query['category'];
  if (typeof req.query['active'] === 'string') opts.active = req.query['active'];
  if (typeof req.query['is_healthy'] === 'string') opts.is_healthy = req.query['is_healthy'];
  const result = await productService.listProducts(req.user!, opts);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const product = await productService.getProduct(id);
  sendSuccess(res, product);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(id, input, req.user!);
  sendSuccess(res, product, 'Producto actualizado');
}

export async function deactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const product = await productService.deactivateProduct(id, req.user!);
  sendSuccess(res, product, 'Producto desactivado');
}

export async function reactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const product = await productService.reactivateProduct(id, req.user!);
  sendSuccess(res, product, 'Producto reactivado');
}

export async function getStats(req: Request, res: Response) {
  const stats = await productService.getProductStats();
  sendSuccess(res, stats);
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await productService.deleteProduct(id, req.user!);
  sendSuccess(res, null, 'Producto eliminado permanentemente');
}
