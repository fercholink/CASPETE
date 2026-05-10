import { z } from 'zod';

export const addStoreProductSchema = z.object({
  product_id: z.string().uuid(),
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
});

export const updateStoreProductSchema = z.object({
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export const bulkAddStoreProductsSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1).max(100),
});

export type AddStoreProductInput = z.infer<typeof addStoreProductSchema>;
export type UpdateStoreProductInput = z.infer<typeof updateStoreProductSchema>;
export type BulkAddStoreProductsInput = z.infer<typeof bulkAddStoreProductsSchema>;
