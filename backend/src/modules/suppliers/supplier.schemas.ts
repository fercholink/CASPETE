import { z } from 'zod';

export const createSupplierSchema = z.object({
  name:          z.string().min(2).max(255),
  nit:           z.string().max(20).optional(),
  contact_name:  z.string().max(100).optional(),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email().optional(),
  city:          z.string().max(100).optional(),
  tech_sheet_url: z.string().max(500).optional(),
  tech_sheet_uploaded_at: z.coerce.date().optional(),
  is_verified:   z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
