import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateProductInput, UpdateProductInput } from './product.schemas.js';

const productSelect = {
  id: true,
  school_id: true,
  name: true,
  description: true,
  price: true,
  image_url: true,
  is_healthy: true,
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

function assertAccess(product: { school_id: string }, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if (actor.schoolId === product.school_id) return;
  throw new AppError('No tienes permiso para modificar este producto', 403);
}

export async function createProduct(input: CreateProductInput, actor: JwtPayload) {
  const schoolId = resolveSchoolId(actor, input.school_id);
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school?.active) throw new AppError('El colegio no existe o está inactivo', 404);

  return prisma.product.create({
    data: {
      school_id: schoolId,
      name: input.name,
      price: input.price,
      is_healthy: input.is_healthy,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
    },
    select: productSelect,
  });
}

export async function listProducts(actor: JwtPayload, schoolId?: string) {
  if (actor.role === 'SUPER_ADMIN') {
    return prisma.product.findMany({
      where: schoolId ? { school_id: schoolId } : {},
      orderBy: { created_at: 'desc' },
      select: productSelect,
    });
  }

  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    return prisma.product.findMany({
      where: { school_id: actor.schoolId },
      orderBy: { created_at: 'desc' },
      select: productSelect,
    });
  }

  // PARENT — necesita school_id explícito para ver productos
  const sid = schoolId;
  if (!sid) throw new AppError('Indica school_id para consultar el catálogo', 400);
  return prisma.product.findMany({
    where: { school_id: sid, active: true },
    orderBy: { name: 'asc' },
    select: productSelect,
  });
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!product) throw new AppError('Producto no encontrado', 404);
  return product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  actor: JwtPayload,
) {
  const product = await getProduct(id);
  assertAccess(product, actor);

  return prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.image_url !== undefined && { image_url: input.image_url }),
      ...(input.is_healthy !== undefined && { is_healthy: input.is_healthy }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: productSelect,
  });
}

export async function deactivateProduct(id: string, actor: JwtPayload) {
  const product = await getProduct(id);
  assertAccess(product, actor);
  return prisma.product.update({
    where: { id },
    data: { active: false },
    select: productSelect,
  });
}
