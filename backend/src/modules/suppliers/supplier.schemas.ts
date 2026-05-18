import { z } from 'zod';

export const createSupplierSchema = z.object({
  name:          z.string().min(2).max(255),
  nit:           z.string().max(20).nullable().optional(),
  contact_name:  z.string().max(100).nullable().optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  city:          z.string().max(100).nullable().optional(),
  tech_sheet_url: z.string().url().max(500).nullable().optional(),
  tech_sheet_uploaded_at: z.coerce.date().nullable().optional(),
  is_verified:   z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
