import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/, 'Solo letras minúsculas, números, guiones y guiones bajos'),
  label: z.string().min(2).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  label: z.string().min(2).max(100).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
