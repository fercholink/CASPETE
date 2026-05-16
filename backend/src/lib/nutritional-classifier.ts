export type ProductFormInput = 'SOLID' | 'LIQUID' | 'SEMI_SOLID' | 'POWDER' | 'GEL';

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
 * Umbrales de sodio por forma de producto — Resolución 2492 de 2022 (Art. 7)
 *
 * | Forma      | Umbral sodio  | Justificación normativa                         |
 * |------------|---------------|-------------------------------------------------|
 * | SOLID      | ≥ 300 mg/100g | Art. 7, Tabla 1 — sólidos                       |
 * | LIQUID     | ≥  40 mg/100ml| Art. 7, Tabla 2 — bebidas                       |
 * | SEMI_SOLID | ≥ 100 mg/100g | Criterio intermedio (yogur, puré, crema)        |
 * | POWDER     | ≥ 400 mg/100g | Polvo analizado por porción equivalente sólida  |
 * | GEL        | ≥ 100 mg/100g | Asimilado a semisólido (gelatina, agar)         |
 */
const SODIUM_THRESHOLDS: Record<ProductFormInput, number> = {
  SOLID:      300,
  LIQUID:      40,
  SEMI_SOLID: 100,
  POWDER:     400,
  GEL:        100,
};

/**
 * Motor de clasificación nutricional v2 — Resolución 2492 de 2022.
 * Brecha #3: diferencia umbrales según ProductForm (5 formas).
 * Los sellos son COMPUTADOS — nunca editables manualmente.
 *
 * Azúcares añadidos ≥ 10% energía total → sello (igual para todas las formas)
 * Grasas saturadas  ≥ 10% energía total → sello (igual para todas las formas)
 * Grasas trans      > 0  (cualquier presencia) → sello
 * Edulcorantes confirmados → sello
 */
export function classifyProduct(input: NutritionalInput): NutritionalClassification {
  const sodium = toNum(input.sodium_per_100);
  const sodiumThreshold = SODIUM_THRESHOLDS[input.product_form] ?? 300;

  const seal_sodium        = sodium >= sodiumThreshold;
  const seal_sugars        = toNum(input.added_sugars_pct)  >= 10;
  const seal_saturated_fat = toNum(input.saturated_fat_pct) >= 10;
  const seal_trans_fat     = toNum(input.trans_fat_pct)      > 0;
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
 * Devuelve el umbral de sodio aplicable a una forma de producto.
 * Útil para mostrar en la UI el valor de referencia correcto.
 */
export function getSodiumThreshold(form: ProductFormInput): number {
  return SODIUM_THRESHOLDS[form] ?? 300;
}

// ─── Compliance de lonchera ────────────────────────────────────────────────

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
    sodium:        products.filter(p => p.seal_sodium).length,
    sugars:        products.filter(p => p.seal_sugars).length,
    saturated_fat: products.filter(p => p.seal_saturated_fat).length,
    trans_fat:     products.filter(p => p.seal_trans_fat).length,
    sweeteners:    products.filter(p => p.seal_sweeteners).length,
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
