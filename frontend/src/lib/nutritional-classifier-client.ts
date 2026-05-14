/** Espejo cliente del NutritionalClassifier del backend.
 *  Permite calcular los sellos en tiempo real en el formulario de productos
 *  sin depender de una llamada al servidor. */

export interface NutritionalClientInput {
  product_form: 'SOLID' | 'LIQUID';
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

const n = (v?: number | null) => v ?? 0;

export function classifyProductClient(input: NutritionalClientInput): NutritionalClientResult {
  const sodiumThreshold = input.product_form === 'LIQUID' ? 40 : 300;
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
