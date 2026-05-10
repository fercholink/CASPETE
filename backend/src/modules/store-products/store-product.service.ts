import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { AddStoreProductInput, UpdateStoreProductInput, BulkAddStoreProductsInput } from './store-product.schemas.js';

// ─── StoreProduct: asignar productos del catálogo global a una tienda ───

const storeProductSelect = {
  id: true,
  store_id: true,
  product_id: true,
  price: true,
  stock: true,
  active: true,
  created_at: true,
  product: {
    select: {
      id: true,
      name: true,
      description: true,
      base_price: true,
      image_url: true,
      category: true,
      is_healthy: true,
      customizable_options: true,
      active: true,
    },
  },
  store: {
    select: { id: true, name: true, school_id: true },
  },
} as const;

async function assertStoreAccess(storeId: string, actor: JwtPayload) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, school_id: true, active: true },
  });
  if (!store?.active) throw new AppError('Tienda no encontrada o inactiva', 404);
  if (actor.role === 'SUPER_ADMIN') return store;
  if (!actor.schoolId || actor.schoolId !== store.school_id) {
    throw new AppError('No tienes permiso sobre esta tienda', 403);
  }
  return store;
}

/** Agregar un producto del catálogo global a una tienda */
export async function addProductToStore(
  storeId: string,
  input: AddStoreProductInput,
  actor: JwtPayload,
) {
  await assertStoreAccess(storeId, actor);

  // Verificar que el producto global exista y esté activo
  const product = await prisma.product.findUnique({ where: { id: input.product_id } });
  if (!product?.active) throw new AppError('El producto no existe o está deshabilitado globalmente', 404);

  // Verificar que no exista ya la asignación
  const existing = await prisma.storeProduct.findUnique({
    where: { store_id_product_id: { store_id: storeId, product_id: input.product_id } },
  });
  if (existing) throw new AppError('Este producto ya está asignado a la tienda', 409);

  return prisma.storeProduct.create({
    data: {
      store_id: storeId,
      product_id: input.product_id,
      price: input.price ?? null,
      stock: input.stock ?? null,
    },
    select: storeProductSelect,
  });
}

/** Agregar varios productos a una tienda de golpe */
export async function bulkAddProducts(
  storeId: string,
  input: BulkAddStoreProductsInput,
  actor: JwtPayload,
) {
  await assertStoreAccess(storeId, actor);

  // Filtrar productos que ya estén asignados
  const existing = await prisma.storeProduct.findMany({
    where: { store_id: storeId, product_id: { in: input.product_ids } },
    select: { product_id: true },
  });
  const existingIds = new Set(existing.map((e) => e.product_id));
  const newIds = input.product_ids.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    return { added: 0, skipped: input.product_ids.length };
  }

  // Verificar que los productos existan
  const products = await prisma.product.findMany({
    where: { id: { in: newIds }, active: true },
    select: { id: true },
  });
  const validIds = products.map((p) => p.id);

  await prisma.storeProduct.createMany({
    data: validIds.map((pid) => ({ store_id: storeId, product_id: pid })),
  });

  return { added: validIds.length, skipped: input.product_ids.length - validIds.length };
}

/** Listar productos de una tienda (lo que el padre ve al hacer un pedido) */
export async function listStoreProducts(storeId: string, actor: JwtPayload, onlyActive = false) {
  // Verificar acceso: PARENT puede ver si la tienda pertenece al colegio de su hijo
  // No necesitamos verificación estricta aquí, cualquier usuario autenticado puede ver el menú
  const where: Record<string, unknown> = { store_id: storeId };
  if (onlyActive) {
    where.active = true;
    where.product = { active: true };
  }

  return prisma.storeProduct.findMany({
    where,
    orderBy: { product: { name: 'asc' } },
    select: storeProductSelect,
  });
}

/** Actualizar precio/stock/active de un producto en una tienda */
export async function updateStoreProduct(
  storeProductId: string,
  input: UpdateStoreProductInput,
  actor: JwtPayload,
) {
  const sp = await prisma.storeProduct.findUnique({
    where: { id: storeProductId },
    select: { id: true, store_id: true, store: { select: { school_id: true } } },
  });
  if (!sp) throw new AppError('Asignación no encontrada', 404);

  // Verificar acceso
  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId || actor.schoolId !== sp.store.school_id) {
      throw new AppError('No tienes permiso sobre esta tienda', 403);
    }
  }

  return prisma.storeProduct.update({
    where: { id: storeProductId },
    data: {
      ...(input.price !== undefined && { price: input.price }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: storeProductSelect,
  });
}

/** Quitar un producto de una tienda */
export async function removeProductFromStore(storeProductId: string, actor: JwtPayload) {
  const sp = await prisma.storeProduct.findUnique({
    where: { id: storeProductId },
    select: { id: true, store_id: true, store: { select: { school_id: true } }, _count: { select: { order_items: true } } },
  });
  if (!sp) throw new AppError('Asignación no encontrada', 404);

  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId || actor.schoolId !== sp.store.school_id) {
      throw new AppError('No tienes permiso sobre esta tienda', 403);
    }
  }

  if (sp._count.order_items > 0) {
    // Soft-delete: solo desactivar
    return prisma.storeProduct.update({
      where: { id: storeProductId },
      data: { active: false },
      select: storeProductSelect,
    });
  }

  await prisma.storeProduct.delete({ where: { id: storeProductId } });
  return null;
}
