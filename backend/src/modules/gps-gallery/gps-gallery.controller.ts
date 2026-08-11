import type { Request, Response } from 'express';
import * as galleryService from './gps-gallery.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { z } from 'zod';

// Sin .url()/.max() bajo — el valor real es un data-URI base64 (foto
// redimensionada en el cliente), no una URL corta.
const createSchema = z.object({
  image_url: z.string().min(1),
  caption: z.string().max(200).optional(),
  sort_order: z.number().int().optional(),
});

const updateSchema = z.object({
  image_url: z.string().min(1).optional(),
  caption: z.string().max(200).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

/** GET /api/gps-gallery/public — lista activas (landing, sin auth) */
export async function listActive(_req: Request, res: Response) {
  const data = await galleryService.listActive();
  sendSuccess(res, data);
}

/** GET /api/gps-gallery — lista todas (admin) */
export async function listAll(_req: Request, res: Response) {
  const data = await galleryService.listAll();
  sendSuccess(res, data);
}

/** POST /api/gps-gallery */
export async function create(req: Request, res: Response) {
  const parsed = createSchema.parse(req.body);
  const createData: { image_url: string; caption?: string; sort_order?: number } = { image_url: parsed.image_url };
  if (parsed.caption !== undefined) createData.caption = parsed.caption;
  if (parsed.sort_order !== undefined) createData.sort_order = parsed.sort_order;
  const data = await galleryService.create(createData);
  sendSuccess(res, data, 'Imagen agregada', 201);
}

/** PUT /api/gps-gallery/:id */
export async function update(req: Request, res: Response) {
  const parsed = updateSchema.parse(req.body);
  const updateData: { image_url?: string; caption?: string; active?: boolean; sort_order?: number } = {};
  if (parsed.image_url !== undefined) updateData.image_url = parsed.image_url;
  if (parsed.caption !== undefined) updateData.caption = parsed.caption;
  if (parsed.active !== undefined) updateData.active = parsed.active;
  if (parsed.sort_order !== undefined) updateData.sort_order = parsed.sort_order;
  const data = await galleryService.update(req.params['id'] as string, updateData);
  sendSuccess(res, data, 'Imagen actualizada');
}

/** DELETE /api/gps-gallery/:id */
export async function remove(req: Request, res: Response) {
  const data = await galleryService.remove(req.params['id'] as string);
  sendSuccess(res, data, 'Imagen eliminada');
}
