import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

export interface NutritionalAuditInput {
  product_id: string;
  editor_id: string;
  prev_level: string;
  prev_seals: string[];
  new_level: string;
  new_seals: string[];
  // Snapshot post-cambio
  product_form?: string | null;
  sodium_per_100?: number | null;
  added_sugars_pct?: number | null;
  saturated_fat_pct?: number | null;
  trans_fat_pct?: number | null;
  has_sweeteners?: boolean;
  notes?: string | null;
}

/** Crea una entrada en el historial de auditoría nutricional.
 *  Llamado desde updateProduct / updateNutritionalData cuando cambian sellos o nivel. */
export async function createNutritionalAuditEntry(input: NutritionalAuditInput) {
  return prisma.nutritionalAuditLog.create({
    data: {
      product_id:       input.product_id,
      editor_id:        input.editor_id,
      prev_level:       input.prev_level,
      prev_seals:       input.prev_seals,
      new_level:        input.new_level,
      new_seals:        input.new_seals,
      product_form:     input.product_form ?? null,
      sodium_per_100:   input.sodium_per_100   ?? null,
      added_sugars_pct: input.added_sugars_pct ?? null,
      saturated_fat_pct:input.saturated_fat_pct ?? null,
      trans_fat_pct:    input.trans_fat_pct    ?? null,
      has_sweeteners:   input.has_sweeteners   ?? false,
      notes:            input.notes            ?? null,
    },
  });
}

/** Lista el historial de cambios nutricionales de un producto, del más reciente al más antiguo. */
export async function listProductNutritionalHistory(productId: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede ver el historial nutricional', 403);
  return prisma.nutritionalAuditLog.findMany({
    where:   { product_id: productId },
    orderBy: { changed_at: 'desc' },
    take:    50,
    select: {
      id: true, changed_at: true,
      prev_level: true, prev_seals: true,
      new_level: true,  new_seals: true,
      product_form: true, sodium_per_100: true,
      added_sugars_pct: true, saturated_fat_pct: true,
      trans_fat_pct: true, has_sweeteners: true,
      notes: true,
      editor: { select: { id: true, email: true, first_name: true, last_name: true } },
    },
  });
}
