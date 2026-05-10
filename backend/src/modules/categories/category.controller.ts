import type { Request, Response } from 'express';
import * as categoryService from './category.service.js';
import { createCategorySchema, updateCategorySchema } from './category.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(input);
  sendSuccess(res, category, 'Categoría creada', 201);
}

export async function list(req: Request, res: Response) {
  const includeInactive = req.query['all'] === 'true';
  const withCounts = req.query['counts'] === 'true';

  if (withCounts) {
    const categories = await categoryService.listCategoriesWithCounts();
    return sendSuccess(res, categories);
  }

  const categories = await categoryService.listCategories(includeInactive);
  sendSuccess(res, categories);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const category = await categoryService.getCategory(id);
  sendSuccess(res, category);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateCategorySchema.parse(req.body);
  const category = await categoryService.updateCategory(id, input);
  sendSuccess(res, category, 'Categoría actualizada');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await categoryService.deleteCategory(id);
  sendSuccess(res, null, 'Categoría eliminada');
}
