import { z } from 'zod';

const nutritionalDataSchema = z.object({
  product_form:      z.enum(['SOLID', 'LIQUID', 'SEMI_SOLID', 'POWDER', 'GEL']).optional(),
  sodium_per_100:    z.number().min(0).max(10000).optional(),  // Art. 7 Res. 2492: max fisiológico
  added_sugars_pct:  z.number().min(0).max(100).optional(),
  saturated_fat_pct: z.number().min(0).max(100).optional(),
  trans_fat_pct:     z.number().min(0).max(100).optional(),
  has_sweeteners:    z.boolean().optional(),
  supplier_tech_sheet_url: z.string().max(500).optional(),
  // Porcion nutricional -- Brecha #5 (Art. 6 Res. 2492/2022)
  serving_size_g:        z.number().min(0).max(10000).optional(),  // g por porcion
  serving_size_ml:       z.number().min(0).max(10000).optional(),  // ml por porcion
  servings_per_package:  z.number().min(0).max(1000).optional(),   // porciones por empaque
  last_nutritional_audit:  z.coerce.date().optional(),
});

export const createProductSchema = z.object({
  name:                 z.string().min(2).max(200),
  description:          z.string().max(1000).optional(),
  base_price:           z.number().positive(),
  image_url:            z.string().max(500).optional(),
  // Clasificación de categoría — usar category_id (FK) preferentemente
  category_id:          z.string().uuid('category_id debe ser un UUID válido').optional().nullable(),
  // Proveedor FK -- Brecha #6 (Art. 32 Res. 2492/2022: trazabilidad B2B)
  supplier_id:          z.string().uuid('supplier_id debe ser UUID').optional().nullable(),
  category:             z.string().max(50).optional(),  // legacy — se sincroniza automáticamente
  // Tipo de producto — Brecha #2 corregida
  product_type:         z.enum(['FOOD', 'DRINK', 'SNACK', 'SUPPLEMENT', 'COMBO']).default('FOOD'),
  // Segmento de edad -- Brecha #4
  age_segment:          z.enum(['PRESCHOOL', 'PRIMARY', 'SECONDARY', 'ALL_AGES']).default('ALL_AGES'),
  is_healthy:           z.boolean().default(true),
  customizable_options: z.array(z.string()).default([]),
  // Ley 2120 — product_form es requerido para clasificación correcta (Art. 7 Res. 2492)
  product_form:         z.enum(['SOLID', 'LIQUID', 'SEMI_SOLID', 'POWDER', 'GEL']).default('SOLID'),
}).merge(nutritionalDataSchema.omit({ product_form: true }));

export const updateProductSchema = z.object({
  name:                 z.string().min(2).max(200).optional(),
  description:          z.string().max(1000).optional(),
  base_price:           z.number().positive().optional(),
  image_url:            z.string().max(500).optional(),
  // Clasificación de categoría — usar category_id (FK) preferentemente
  category_id:          z.string().uuid('category_id debe ser un UUID válido').optional().nullable(),
  // Proveedor FK -- Brecha #6 (Art. 32 Res. 2492/2022: trazabilidad B2B)
  supplier_id:          z.string().uuid('supplier_id debe ser UUID').optional().nullable(),
  category:             z.string().max(50).optional(),  // legacy
  // Tipo de producto — Brecha #2 corregida
  product_type:         z.enum(['FOOD', 'DRINK', 'SNACK', 'SUPPLEMENT', 'COMBO']).optional(),
  // Segmento de edad -- Brecha #4
  age_segment:          z.enum(['PRESCHOOL', 'PRIMARY', 'SECONDARY', 'ALL_AGES']).optional(),
  is_healthy:           z.boolean().optional(),
  active:               z.boolean().optional(),
  customizable_options: z.array(z.string()).optional(),
}).merge(nutritionalDataSchema);

// Solo campos nutricionales — para PATCH /nutritional-data y POST /audit
export const updateNutritionalDataSchema = nutritionalDataSchema;

export type CreateProductInput         = z.infer<typeof createProductSchema>;
export type UpdateProductInput         = z.infer<typeof updateProductSchema>;
export type UpdateNutritionalDataInput = z.infer<typeof updateNutritionalDataSchema>;
