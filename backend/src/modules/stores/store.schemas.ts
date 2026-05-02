import { z } from 'zod';

export const createStoreSchema = z.object({
  school_id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
});

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  active: z.boolean().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
