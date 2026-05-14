export type ProductFormInput = 'SOLID' | 'LIQUID';

export interface NutritionalInput {
  product_form: ProductFormInput;
  sodium_per_100?: number | null;
  added_sugars_pct?: number | null;
  saturated_fat_pct?: number | null;
  trans_fat_pct?: number | null;
  has_sweeteners: boolean;
}

export interface NutritionalClassification {
  seal_sodium: boolean;
  seal_sugars: boolean;
  seal_saturated_fat: boolean;
  seal_trans_fat: boolean;
  seal_sweeteners: boolean;
  nutritional_level: 'LEVEL_1' | 'LEVEL_2';
}

const toNum = (v?: number | null): number => v == null ? 0 : v;

/**
 * Motor de clasificación nutricional según Resolución 2492 de 2022.
 * Los sellos son COMPUTADOS — nunca editables manualmente.
 *
 * Umbrales sólidos: sodio ≥ 300 mg/100g | Umbrales líquidos: sodio ≥ 40 mg/100ml
 * Azúcares añadidos ≥ 10% energía total → sello
 * Grasas saturadas  ≥ 10% energía total → sello
 * Grasas trans      > 0  (cualquier presencia) → sello
 * Edulcorantes confirmados → sello
 */
export function classifyProduct(input: NutritionalInput): NutritionalClassification {
  const sodium = toNum(input.sodium_per_100);
  const sodiumThreshold = input.product_form === 'LIQUID' ? 40 : 300;

  const seal_sodium        = sodium >= sodiumThreshold;
  const seal_sugars        = toNum(input.added_sugars_pct)    >= 10;
  const seal_saturated_fat = toNum(input.saturated_fat_pct)   >= 10;
  const seal_trans_fat     = toNum(input.trans_fat_pct)        > 0;
  const seal_sweeteners    = input.has_sweeteners === true;

  const hasAnySeal = seal_sodium || seal_sugars || seal_saturated_fat || seal_trans_fat || seal_sweeteners;

  return {
    seal_sodium,
    seal_sugars,
    seal_saturated_fat,
    seal_trans_fat,
    seal_sweeteners,
    nutritional_level: hasAnySeal ? 'LEVEL_2' : 'LEVEL_1',
  };
}

/**
 * Calcula el compliance score y los campos de cumplimiento de una lonchera
 * a partir del array de productos que la componen.
 */
export interface ProductSummaryForOrder {
  nutritional_level: 'LEVEL_1' | 'LEVEL_2';
  seal_sodium: boolean;
  seal_sugars: boolean;
  seal_saturated_fat: boolean;
  seal_trans_fat: boolean;
  seal_sweeteners: boolean;
}

export interface OrderComplianceResult {
  is_seal_free: boolean;
  has_sweetener_alert: boolean;
  seal_summary: Record<string, number>;
  compliance_score: number; // 0–100
}

export function calculateOrderCompliance(products: ProductSummaryForOrder[]): OrderComplianceResult {
  if (products.length === 0) {
    return { is_seal_free: true, has_sweetener_alert: false, seal_summary: {}, compliance_score: 100 };
  }

  const seal_summary = {
    sodium: products.filter(p => p.seal_sodium).length,
    sugars: products.filter(p => p.seal_sugars).length,
    saturated_fat: products.filter(p => p.seal_saturated_fat).length,
    trans_fat: products.filter(p => p.seal_trans_fat).length,
    sweeteners: products.filter(p => p.seal_sweeteners).length,
  };

  const is_seal_free = products.every(p => p.nutritional_level === 'LEVEL_1');
  const has_sweetener_alert = products.some(p => p.seal_sweeteners);

  const totalSeals = Object.values(seal_summary).reduce((a, b) => a + b, 0);
  const maxPossibleSeals = products.length * 5;
  const compliance_score = maxPossibleSeals === 0
    ? 100
    : Math.round((1 - totalSeals / maxPossibleSeals) * 100);

  return { is_seal_free, has_sweetener_alert, seal_summary, compliance_score };
}
