/** Espejo cliente del NutritionalClassifier del backend — v2.
 *  Brecha #3: soporta 5 formas de producto con umbrales distintos de sodio.
 *  Permite calcular los sellos en tiempo real sin depender del servidor. */

export type ProductFormClient = 'SOLID' | 'LIQUID' | 'SEMI_SOLID' | 'POWDER' | 'GEL';

export interface NutritionalClientInput {
  product_form: ProductFormClient;
  sodium_per_100?: number | null;
  added_sugars_pct?: number | null;
  saturated_fat_pct?: number | null;
  trans_fat_pct?: number | null;
  has_sweeteners: boolean;
}

export interface NutritionalClientResult {
  seal_sodium: boolean;
  seal_sugars: boolean;
  seal_saturated_fat: boolean;
  seal_trans_fat: boolean;
  seal_sweeteners: boolean;
  nutritional_level: 'LEVEL_1' | 'LEVEL_2';
}

/** Umbrales de sodio por forma — espejo de SODIUM_THRESHOLDS del backend */
export const SODIUM_THRESHOLDS_CLIENT: Record<ProductFormClient, number> = {
  SOLID:      300,
  LIQUID:      40,
  SEMI_SOLID: 100,
  POWDER:     400,
  GEL:        100,
};

const n = (v?: number | null) => v ?? 0;

export function classifyProductClient(input: NutritionalClientInput): NutritionalClientResult {
  const sodiumThreshold = SODIUM_THRESHOLDS_CLIENT[input.product_form] ?? 300;
  const seal_sodium        = n(input.sodium_per_100) >= sodiumThreshold;
  const seal_sugars        = n(input.added_sugars_pct)  >= 10;
  const seal_saturated_fat = n(input.saturated_fat_pct) >= 10;
  const seal_trans_fat     = n(input.trans_fat_pct)      > 0;
  const seal_sweeteners    = input.has_sweeteners === true;
  const hasAnySeal = seal_sodium || seal_sugars || seal_saturated_fat || seal_trans_fat || seal_sweeteners;
  return {
    seal_sodium, seal_sugars, seal_saturated_fat, seal_trans_fat, seal_sweeteners,
    nutritional_level: hasAnySeal ? 'LEVEL_2' : 'LEVEL_1',
  };
}

/** Devuelve el umbral de sodio para mostrar en la UI junto al selector de forma */
export function getSodiumThresholdClient(form: ProductFormClient): number {
  return SODIUM_THRESHOLDS_CLIENT[form] ?? 300;
}
