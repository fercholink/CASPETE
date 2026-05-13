import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  nit: z.string().max(20).optional(),
  city: z.string().min(2).max(100),
  department: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').optional(),
  country_code: z.string().optional(),
  email: z.string().email().max(255).optional(),
  logo_url: z.string().url().max(500).optional(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).default('BASIC'),
});

export const updateSchoolSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  nit: z.string().max(20).optional(),
  city: z.string().min(2).max(100).optional(),
  department: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').optional(),
  country_code: z.string().optional(),
  email: z.string().email().max(255).optional(),
  logo_url: z.string().url().max(500).optional(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  active: z.boolean().optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
