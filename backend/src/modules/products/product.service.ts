import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { classifyProduct } from '../../lib/nutritional-classifier.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  UpdateNutritionalDataInput,
} from './product.schemas.js';

// ─── Select común ──────────────────────────────────────────────────────────
const productSelect = {
  id: true, name: true, description: true, base_price: true,
  image_url: true, category: true, category_id: true,
  product_type: true,  // Brecha #2: tipo de producto
  is_healthy: true, active: true,
  customizable_options: true, created_at: true,
  // Brecha #1 corregida: categoría FK con label e icon para el frontend
  category_rel: {
    select: { id: true, name: true, label: true, icon: true, color: true },
  },
  // Ley 2120
  product_form: true, nutritional_level: true,
  sodium_per_100: true, added_sugars_pct: true,
  saturated_fat_pct: true, trans_fat_pct: true, has_sweeteners: true,
  seal_sodium: true, seal_sugars: true, seal_saturated_fat: true,
  seal_trans_fat: true, seal_sweeteners: true,
  supplier_tech_sheet_url: true, last_nutritional_audit: true,
  // Alérgenos declarados (Art. 26 Ley 2120)
  allergens: {
    select: { allergy: { select: { id: true, name: true, severity: true } } },
  },
  _count: { select: { store_products: true } },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildNutritionalSeals(input: Partial<CreateProductInput>) {
  if (
    input.product_form == null &&
    input.sodium_per_100 == null &&
    input.added_sugars_pct == null &&
    input.saturated_fat_pct == null &&
    input.trans_fat_pct == null &&
    input.has_sweeteners == null
  ) return {};

  const seals = classifyProduct({
    product_form:      (input.product_form ?? 'SOLID') as 'SOLID' | 'LIQUID' | 'SEMI_SOLID' | 'POWDER' | 'GEL',
    sodium_per_100:    input.sodium_per_100    != null ? Number(input.sodium_per_100)    : null,
    added_sugars_pct:  input.added_sugars_pct  != null ? Number(input.added_sugars_pct)  : null,
    saturated_fat_pct: input.saturated_fat_pct != null ? Number(input.saturated_fat_pct) : null,
    trans_fat_pct:     input.trans_fat_pct     != null ? Number(input.trans_fat_pct)     : null,
    has_sweeteners:    input.has_sweeteners    ?? false,
  });
  // is_healthy se sincroniza con el nivel nutricional (LEVEL_1 = saludable)
  return { ...seals, is_healthy: seals.nutritional_level === 'LEVEL_1' };
}

/**
 * Resuelve el slug (campo legacy `category`) desde category_id.
 * Permite que el frontend envíe solo category_id y el backend
 * mantenga automáticamente la columna legacy sincronizada.
 */
async function resolveCategorySlug(
  category_id?: string | null,
  categoryFallback?: string,
): Promise<{ category_id?: string | null; category?: string | null }> {
  if (category_id) {
    const cat = await prisma.productCategory.findUnique({
      where: { id: category_id },
      select: { name: true },
    });
    if (!cat) throw new AppError('Categoría no encontrada', 404);
    return { category_id, category: cat.name }; // sincroniza slug legacy
  }
  // Si solo llega el slug legacy (compatibilidad hacia atrás)
  if (categoryFallback) {
    const cat = await prisma.productCategory.findUnique({
      where: { name: categoryFallback },
      select: { id: true, name: true },
    });
    if (cat) return { category_id: cat.id, category: cat.name };
    // Categoría nueva no registrada: guardar solo slug legacy (sin FK)
    return { category_id: null, category: categoryFallback };
  }
  return {}; // sin cambio de categoría
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
export async function createProduct(input: CreateProductInput, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede crear productos', 403);
  const seals = buildNutritionalSeals(input);
  const catData = await resolveCategorySlug(input.category_id, input.category);
  return prisma.product.create({
    data: {
      name: input.name, base_price: input.base_price,
      product_type: input.product_type ?? 'FOOD',
      is_healthy: input.is_healthy, description: input.description ?? null,
      image_url: input.image_url ?? null,
      ...catData,
      customizable_options: input.customizable_options ?? [],
      product_form: input.product_form ?? 'SOLID',
      sodium_per_100: input.sodium_per_100 ?? null,
      added_sugars_pct: input.added_sugars_pct ?? null,
      saturated_fat_pct: input.saturated_fat_pct ?? null,
      trans_fat_pct: input.trans_fat_pct ?? null,
      has_sweeteners: input.has_sweeteners ?? false,
      supplier_tech_sheet_url: input.supplier_tech_sheet_url ?? null,
      last_nutritional_audit: input.last_nutritional_audit ?? null,
      ...seals,
    },
    select: productSelect,
  });
}

export async function listProducts(
  actor: JwtPayload,
  opts: {
    page?: number; limit?: number; search?: string; category?: string;
    category_id?: string; active?: string; is_healthy?: string; level?: string; seal_free?: string;
  } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};

  // Filtro por categoría: preferir category_id (FK) sobre slug legacy
  if (opts.category_id) where.category_id = opts.category_id;
  else if (opts.category)   where.category  = opts.category;
  if (opts.active !== undefined) where.active = opts.active === 'true';
  if (opts.is_healthy !== undefined) where.is_healthy = opts.is_healthy === 'true';
  // Filtro "Libre de Sellos" Ley 2120
  if (opts.level) where.nutritional_level = opts.level.toUpperCase();
  if (opts.seal_free === 'true') where.nutritional_level = 'LEVEL_1';
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }], skip, take: limit, select: productSelect }),
    prisma.product.count({ where }),
  ]);

  const categoryStats = await prisma.product.groupBy({
    by: ['category_id'], _count: true,
    where: opts.active !== undefined ? { active: opts.active === 'true' } : {},
  });

  return {
    products, total, page,
    pages: Math.ceil(total / limit),
    categories: categoryStats.map(c => ({ id: c.category_id ?? null, count: c._count })),
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!product) throw new AppError('Producto no encontrado', 404);
  return product;
}

export async function getProductSeals(id: string) {
  const product = await getProduct(id);
  const seals = [];
  if (product.seal_sodium)        seals.push({ code: 'ALTO_EN_SODIO',           label: 'ALTO EN SODIO' });
  if (product.seal_sugars)        seals.push({ code: 'ALTO_EN_AZUCARES',         label: 'ALTO EN AZÚCARES' });
  if (product.seal_saturated_fat) seals.push({ code: 'ALTO_EN_GRASAS_SATURADAS', label: 'ALTO EN GRASAS SATURADAS' });
  if (product.seal_trans_fat)     seals.push({ code: 'ALTO_EN_GRASAS_TRANS',     label: 'ALTO EN GRASAS TRANS' });
  if (product.seal_sweeteners)    seals.push({ code: 'CONTIENE_EDULCORANTES',    label: 'CONTIENE EDULCORANTES' });
  return { product_id: id, nutritional_level: product.nutritional_level, seals };
}

export async function updateProduct(id: string, input: UpdateProductInput, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede editar el catálogo', 403);
  await getProduct(id);
  const seals = buildNutritionalSeals(input as Partial<CreateProductInput>);
  // Si viene category_id o category en el payload, resolverlos
  const catData = (input.category_id !== undefined || input.category !== undefined)
    ? await resolveCategorySlug(input.category_id, input.category)
    : {};
  return prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.base_price !== undefined && { base_price: input.base_price }),
      ...(input.image_url !== undefined && { image_url: input.image_url ?? null }),
      ...catData,
      ...(input.product_type !== undefined && { product_type: input.product_type }),
      ...(input.is_healthy !== undefined && { is_healthy: input.is_healthy }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.customizable_options !== undefined && { customizable_options: input.customizable_options }),
      ...(input.product_form !== undefined && { product_form: input.product_form }),
      ...(input.sodium_per_100 !== undefined && { sodium_per_100: input.sodium_per_100 ?? null }),
      ...(input.added_sugars_pct !== undefined && { added_sugars_pct: input.added_sugars_pct ?? null }),
      ...(input.saturated_fat_pct !== undefined && { saturated_fat_pct: input.saturated_fat_pct ?? null }),
      ...(input.trans_fat_pct !== undefined && { trans_fat_pct: input.trans_fat_pct ?? null }),
      ...(input.has_sweeteners !== undefined && { has_sweeteners: input.has_sweeteners }),
      ...(input.supplier_tech_sheet_url !== undefined && { supplier_tech_sheet_url: input.supplier_tech_sheet_url ?? null }),
      ...(input.last_nutritional_audit !== undefined && { last_nutritional_audit: input.last_nutritional_audit ?? null }),
      ...seals,
    },
    select: productSelect,
  });
}

export async function updateNutritionalData(id: string, input: UpdateNutritionalDataInput, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede auditar productos', 403);
  const product = await getProduct(id);

  // Merge con valores actuales para recalcular sellos completos
  const merged = {
    product_form:      (input.product_form ?? product.product_form) as 'SOLID' | 'LIQUID' | 'SEMI_SOLID' | 'POWDER' | 'GEL',
    sodium_per_100:    input.sodium_per_100    != null ? Number(input.sodium_per_100)    : product.sodium_per_100    != null ? Number(product.sodium_per_100)    : null,
    added_sugars_pct:  input.added_sugars_pct  != null ? Number(input.added_sugars_pct)  : product.added_sugars_pct  != null ? Number(product.added_sugars_pct)  : null,
    saturated_fat_pct: input.saturated_fat_pct != null ? Number(input.saturated_fat_pct) : product.saturated_fat_pct != null ? Number(product.saturated_fat_pct) : null,
    trans_fat_pct:     input.trans_fat_pct     != null ? Number(input.trans_fat_pct)     : product.trans_fat_pct     != null ? Number(product.trans_fat_pct)     : null,
    has_sweeteners:    input.has_sweeteners    ?? product.has_sweeteners,
  };
  const seals = classifyProduct(merged);

  return prisma.product.update({
    where: { id },
    data: {
      ...merged,
      ...seals,
      last_nutritional_audit: new Date(),
      ...(input.supplier_tech_sheet_url !== undefined && { supplier_tech_sheet_url: input.supplier_tech_sheet_url }),
    },
    select: productSelect,
  });
}

export async function registerAudit(id: string, input: UpdateNutritionalDataInput, actor: JwtPayload) {
  return updateNutritionalData(id, input, actor);
}

export async function deactivateProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede desactivar productos', 403);
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: { active: false }, select: productSelect });
}

export async function reactivateProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede reactivar productos', 403);
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: { active: true }, select: productSelect });
}

export async function deleteProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede eliminar productos', 403);
  await getProduct(id);
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { store_product: { product_id: id } } }),
    prisma.storeProduct.deleteMany({ where: { product_id: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
}

export async function getProductStats() {
  const [total, active, healthy, level1, level2, categories] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { is_healthy: true, active: true } }),
    prisma.product.count({ where: { nutritional_level: 'LEVEL_1', active: true } }),
    prisma.product.count({ where: { nutritional_level: 'LEVEL_2', active: true } }),
    prisma.productCategory.findMany({
      select: { id: true, name: true, label: true, icon: true, _count: { select: { products: true } } },
      orderBy: { sort_order: 'asc' },
    }),
  ]);
  return {
    total, active, healthy, level1, level2,
    pct_seal_free: active > 0 ? Math.round((level1 / active) * 100) : 0,
    // Estadísticas por categoría con label e icon desde la FK real
    categories: categories.map(c => ({
      id: c.id, name: c.name, label: c.label, icon: c.icon,
      count: c._count.products,
    })),
  };
}
