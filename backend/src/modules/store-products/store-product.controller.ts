import type { Request, Response } from 'express';
import * as storeProductService from './store-product.service.js';
import {
  addStoreProductSchema,
  updateStoreProductSchema,
  bulkAddStoreProductsSchema,
} from './store-product.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/** POST /api/stores/:storeId/products — agregar un producto */
export async function addProduct(req: Request, res: Response) {
  const storeId = req.params['storeId'] as string;
  const input = addStoreProductSchema.parse(req.body);
  const sp = await storeProductService.addProductToStore(storeId, input, req.user!);
  sendSuccess(res, sp, 'Producto agregado a la tienda', 201);
}

/** POST /api/stores/:storeId/products/bulk — agregar varios */
export async function bulkAdd(req: Request, res: Response) {
  const storeId = req.params['storeId'] as string;
  const input = bulkAddStoreProductsSchema.parse(req.body);
  const result = await storeProductService.bulkAddProducts(storeId, input, req.user!);
  sendSuccess(res, result, `${result.added} productos agregados`);
}

/** GET /api/stores/:storeId/products — listar productos de una tienda */
export async function listProducts(req: Request, res: Response) {
  const storeId = req.params['storeId'] as string;
  const onlyActive = req.query['active'] === 'true';
  const products = await storeProductService.listStoreProducts(storeId, req.user!, onlyActive);
  sendSuccess(res, products);
}

/** PATCH /api/store-products/:id — actualizar precio/stock/active */
export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateStoreProductSchema.parse(req.body);
  const sp = await storeProductService.updateStoreProduct(id, input, req.user!);
  sendSuccess(res, sp, 'Producto actualizado en la tienda');
}

/** DELETE /api/store-products/:id — quitar producto de tienda */
export async function remove(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const result = await storeProductService.removeProductFromStore(id, req.user!);
  sendSuccess(res, result, result ? 'Producto desactivado' : 'Producto removido de la tienda');
}
