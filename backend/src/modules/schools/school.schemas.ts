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
  meal_payment_model: z.enum(['PER_ORDER', 'INCLUDED']).default('PER_ORDER'),
  acquisition_model: z.enum(['COMMISSION', 'MONTHLY_FEE']).default('COMMISSION'),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  monthly_fee: z.coerce.number().min(0).optional(),
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
  meal_payment_model: z.enum(['PER_ORDER', 'INCLUDED']).optional(),
  acquisition_model: z.enum(['COMMISSION', 'MONTHLY_FEE']).optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  monthly_fee: z.coerce.number().min(0).optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
