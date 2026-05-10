import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateProductInput, UpdateProductInput } from './product.schemas.js';

// ─── Catálogo global de productos (solo SUPER_ADMIN gestiona) ───

const productSelect = {
  id: true,
  name: true,
  description: true,
  base_price: true,
  image_url: true,
  category: true,
  is_healthy: true,
  active: true,
  customizable_options: true,
  created_at: true,
  _count: { select: { store_products: true } },
} as const;

export async function createProduct(input: CreateProductInput, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede crear productos en el catálogo global', 403);
  }

  return prisma.product.create({
    data: {
      name: input.name,
      base_price: input.base_price,
      is_healthy: input.is_healthy,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      category: input.category ?? null,
      customizable_options: input.customizable_options ?? [],
    },
    select: productSelect,
  });
}

export async function listProducts(
  actor: JwtPayload,
  opts: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    active?: string;
    is_healthy?: string;
  } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (opts.category) where.category = opts.category;
  if (opts.active !== undefined) where.active = opts.active === 'true';
  if (opts.is_healthy !== undefined) where.is_healthy = opts.is_healthy === 'true';

  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      select: productSelect,
    }),
    prisma.product.count({ where }),
  ]);

  // Get category counts for sidebar
  const categoryStats = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
    where: opts.active !== undefined ? { active: opts.active === 'true' } : {},
  });

  return {
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
    categories: categoryStats.map(c => ({
      name: c.category ?? 'otro',
      count: c._count,
    })),
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!product) throw new AppError('Producto no encontrado', 404);
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede editar el catálogo global', 403);
  }
  await getProduct(id);

  return prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.base_price !== undefined && { base_price: input.base_price }),
      ...(input.image_url !== undefined && { image_url: input.image_url }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.is_healthy !== undefined && { is_healthy: input.is_healthy }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.customizable_options !== undefined && { customizable_options: input.customizable_options }),
    },
    select: productSelect,
  });
}

export async function deactivateProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede desactivar productos globales', 403);
  }
  await getProduct(id);
  return prisma.product.update({
    where: { id },
    data: { active: false },
    select: productSelect,
  });
}

export async function reactivateProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede reactivar productos globales', 403);
  }
  await getProduct(id);
  return prisma.product.update({
    where: { id },
    data: { active: true },
    select: productSelect,
  });
}

export async function deleteProduct(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede eliminar productos permanentemente', 403);
  }
  await getProduct(id);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({
      where: { store_product: { product_id: id } },
    }),
    prisma.storeProduct.deleteMany({ where: { product_id: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
}

export async function getProductStats() {
  const [total, active, healthy, categories] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { is_healthy: true, active: true } }),
    prisma.product.groupBy({ by: ['category'], _count: true }),
  ]);
  return { total, active, healthy, categories: categories.map(c => ({ name: c.category ?? 'otro', count: c._count })) };
}
