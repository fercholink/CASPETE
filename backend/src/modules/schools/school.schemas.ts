import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  nit: z.string().max(20).optional(),
  city: z.string().min(2).max(100),
  address: z.string().max(500).optional(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).default('BASIC'),
});

export const updateSchoolSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  nit: z.string().max(20).optional(),
  city: z.string().min(2).max(100).optional(),
  address: z.string().max(500).optional(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  active: z.boolean().optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
