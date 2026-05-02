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
  const schoolId = req.query['school_id'] as string | undefined;
  const products = await productService.listProducts(req.user!, schoolId);
  sendSuccess(res, products);
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
