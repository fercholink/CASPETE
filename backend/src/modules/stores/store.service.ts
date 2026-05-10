import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateStoreInput, UpdateStoreInput } from './store.schemas.js';

const storeSelect = {
  id: true,
  school_id: true,
  name: true,
  active: true,
  created_at: true,
  school: { select: { id: true, name: true, city: true, plan: true } },
  _count: {
    select: {
      store_products: true,
      lunch_orders: true,
    },
  },
} as const;

function resolveSchoolId(actor: JwtPayload, inputSchoolId?: string): string {
  if (actor.role === 'SUPER_ADMIN') {
    if (!inputSchoolId) throw new AppError('school_id es requerido', 400);
    return inputSchoolId;
  }
  if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
  return actor.schoolId;
}

function assertAccess(store: { school_id: string }, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if (actor.schoolId === store.school_id) return;
  throw new AppError('No tienes permiso para modificar esta tienda', 403);
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createStore(input: CreateStoreInput, actor: JwtPayload) {
  const schoolId = resolveSchoolId(actor, input.school_id);
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school?.active) throw new AppError('El colegio no existe o está inactivo', 404);

  return prisma.store.create({
    data: { school_id: schoolId, name: input.name },
    select: storeSelect,
  });
}

export async function listStores(
  actor: JwtPayload,
  opts: {
    page?: number;
    limit?: number;
    search?: string;
    school_id?: string;
    active?: string;
  } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  // Build where clause based on actor role
  const where: Record<string, unknown> = {};

  if (actor.role === 'SUPER_ADMIN') {
    if (opts.school_id) where.school_id = opts.school_id;
  } else if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;
  } else {
    // PARENT — requires school_id
    if (!opts.school_id) throw new AppError('Indica school_id para ver tiendas', 400);
    where.school_id = opts.school_id;
    where.active = true; // parents only see active stores
  }

  // Search filter
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { school: { name: { contains: opts.search, mode: 'insensitive' } } },
    ];
  }

  // Active filter (only for admins)
  if (opts.active !== undefined && actor.role !== 'PARENT') {
    where.active = opts.active === 'true';
  }

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: storeSelect,
    }),
    prisma.store.count({ where }),
  ]);

  return { stores, total, page, pages: Math.ceil(total / limit) };
}

export async function getStore(id: string) {
  const store = await prisma.store.findUnique({ where: { id }, select: storeSelect });
  if (!store) throw new AppError('Tienda no encontrada', 404);
  return store;
}

export async function updateStore(id: string, input: UpdateStoreInput, actor: JwtPayload) {
  const store = await getStore(id);
  assertAccess(store, actor);
  return prisma.store.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: storeSelect,
  });
}

export async function deactivateStore(id: string, actor: JwtPayload) {
  const store = await getStore(id);
  assertAccess(store, actor);
  return prisma.store.update({ where: { id }, data: { active: false }, select: storeSelect });
}

export async function reactivateStore(id: string, actor: JwtPayload) {
  const store = await getStore(id);
  assertAccess(store, actor);
  return prisma.store.update({ where: { id }, data: { active: true }, select: storeSelect });
}

export async function deleteStore(id: string, actor: JwtPayload) {
  const store = await getStore(id);
  assertAccess(store, actor);

  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede eliminar tiendas permanentemente', 403);
  }

  await prisma.$transaction([
    // 1. OrderItems de pedidos de esta tienda
    prisma.orderItem.deleteMany({ where: { order: { store_id: id } } }),
    // 2. Transacciones vinculadas a pedidos de esta tienda
    prisma.transaction.deleteMany({ where: { order: { store_id: id } } }),
    // 3. Pedidos de esta tienda
    prisma.lunchOrder.deleteMany({ where: { store_id: id } }),
    // 4. StoreProducts de esta tienda
    prisma.storeProduct.deleteMany({ where: { store_id: id } }),
    // 5. La tienda
    prisma.store.delete({ where: { id } }),
  ]);
}

// ─── Stats ───────────────────────────────────────────────────────

export async function getStoreStats(actor: JwtPayload) {
  const where: Record<string, unknown> = {};
  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;
  } else if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permiso', 403);
  }

  const [total, active, inactive, productsCount, ordersCount] = await Promise.all([
    prisma.store.count({ where }),
    prisma.store.count({ where: { ...where, active: true } }),
    prisma.store.count({ where: { ...where, active: false } }),
    prisma.storeProduct.count({
      where: where.school_id ? { store: { school_id: where.school_id as string } } : {},
    }),
    prisma.lunchOrder.count({
      where: where.school_id ? { store: { school_id: where.school_id as string } } : {},
    }),
  ]);

  return { total, active, inactive, products: productsCount, orders: ordersCount };
}
