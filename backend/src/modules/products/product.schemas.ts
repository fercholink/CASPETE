import { z } from 'zod';

export const createProductSchema = z.object({
  school_id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  image_url: z.string().max(500).optional(),
  is_healthy: z.boolean().default(true),
  stock: z.number().int().min(0).optional().nullable(),
  customizable_options: z.array(z.string()).default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  image_url: z.string().max(500).optional(),
  is_healthy: z.boolean().optional(),
  active: z.boolean().optional(),
  stock: z.number().int().min(0).optional().nullable(),
  customizable_options: z.array(z.string()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
