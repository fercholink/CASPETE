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
  school: { select: { id: true, name: true, city: true } },
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

export async function createStore(input: CreateStoreInput, actor: JwtPayload) {
  const schoolId = resolveSchoolId(actor, input.school_id);
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school?.active) throw new AppError('El colegio no existe o está inactivo', 404);

  return prisma.store.create({
    data: { school_id: schoolId, name: input.name },
    select: storeSelect,
  });
}

export async function listStores(actor: JwtPayload, schoolId?: string) {
  if (actor.role === 'SUPER_ADMIN') {
    return prisma.store.findMany({
      where: schoolId ? { school_id: schoolId } : {},
      orderBy: { created_at: 'desc' },
      select: storeSelect,
    });
  }
  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    return prisma.store.findMany({
      where: { school_id: actor.schoolId, active: true },
      orderBy: { name: 'asc' },
      select: storeSelect,
    });
  }
  // PARENT necesita school_id explícito
  if (!schoolId) throw new AppError('Indica school_id para ver tiendas', 400);
  return prisma.store.findMany({
    where: { school_id: schoolId, active: true },
    orderBy: { name: 'asc' },
    select: storeSelect,
  });
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

export async function deleteStore(id: string, actor: JwtPayload) {
  const store = await getStore(id);
  assertAccess(store, actor);

  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede eliminar tiendas permanentemente', 403);
  }

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { order: { store_id: id } } }),
    prisma.transaction.deleteMany({ where: { order: { store_id: id } } }),
    prisma.lunchOrder.deleteMany({ where: { store_id: id } }),
    prisma.store.delete({ where: { id } }),
  ]);
}
