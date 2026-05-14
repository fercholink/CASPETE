import { z } from 'zod';

const nutritionalDataSchema = z.object({
  product_form:      z.enum(['SOLID', 'LIQUID']).optional(),
  sodium_per_100:    z.number().min(0).max(10000).optional(),  // Art. 7 Res. 2492: max fisiológico
  added_sugars_pct:  z.number().min(0).max(100).optional(),
  saturated_fat_pct: z.number().min(0).max(100).optional(),
  trans_fat_pct:     z.number().min(0).max(100).optional(),
  has_sweeteners:    z.boolean().optional(),
  supplier_tech_sheet_url: z.string().max(500).optional(),
  last_nutritional_audit:  z.coerce.date().optional(),
});

export const createProductSchema = z.object({
  name:                 z.string().min(2).max(200),
  description:          z.string().max(1000).optional(),
  base_price:           z.number().positive(),
  image_url:            z.string().max(500).optional(),
  category:             z.string().max(50).optional(),
  is_healthy:           z.boolean().default(true),
  customizable_options: z.array(z.string()).default([]),
  // Ley 2120 — product_form es requerido para clasificación correcta (Art. 7 Res. 2492)
  product_form:         z.enum(['SOLID', 'LIQUID']).default('SOLID'),
}).merge(nutritionalDataSchema.omit({ product_form: true }));

export const updateProductSchema = z.object({
  name:                 z.string().min(2).max(200).optional(),
  description:          z.string().max(1000).optional(),
  base_price:           z.number().positive().optional(),
  image_url:            z.string().max(500).optional(),
  category:             z.string().max(50).optional(),
  is_healthy:           z.boolean().optional(),
  active:               z.boolean().optional(),
  customizable_options: z.array(z.string()).optional(),
}).merge(nutritionalDataSchema);

// Solo campos nutricionales — para PATCH /nutritional-data y POST /audit
export const updateNutritionalDataSchema = nutritionalDataSchema;

export type CreateProductInput         = z.infer<typeof createProductSchema>;
export type UpdateProductInput         = z.infer<typeof updateProductSchema>;
export type UpdateNutritionalDataInput = z.infer<typeof updateNutritionalDataSchema>;
