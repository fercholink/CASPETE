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
  const search = req.query['search'] as string | undefined;
  const category = req.query['category'] as string | undefined;
  const active = req.query['active'] as string | undefined;
  const is_healthy = req.query['is_healthy'] as string | undefined;
  const result = await productService.listProducts(req.user!, { page, limit, search, category, active, is_healthy });
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
