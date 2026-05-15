import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schemas.js';

const categorySelect = {
  id: true,
  name: true,
  label: true,
  icon: true,
  color: true,
  sort_order: true,
  active: true,
  created_at: true,
} as const;

export async function createCategory(input: CreateCategoryInput) {
  const exists = await prisma.productCategory.findUnique({ where: { name: input.name } });
  if (exists) throw new AppError(`Ya existe una categoría con el nombre "${input.name}"`, 409);

  return prisma.productCategory.create({
    data: {
      name: input.name,
      label: input.label,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sort_order: input.sort_order ?? 0,
    },
    select: categorySelect,
  });
}

export async function listCategories(includeInactive = false) {
  return prisma.productCategory.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    select: categorySelect,
  });
}

export async function getCategory(id: string) {
  const cat = await prisma.productCategory.findUnique({ where: { id }, select: categorySelect });
  if (!cat) throw new AppError('Categoría no encontrada', 404);
  return cat;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await getCategory(id);
  return prisma.productCategory.update({
    where: { id },
    data: {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: categorySelect,
  });
}

export async function deleteCategory(id: string) {
  const cat = await getCategory(id);

  // Verificar si hay productos usando esta categoría (por FK)
  const count = await prisma.product.count({ where: { category_id: cat.id } });
  if (count > 0) {
    throw new AppError(`No se puede eliminar: ${count} producto(s) usan esta categoría. Reasígnalos primero.`, 409);
  }

  await prisma.productCategory.delete({ where: { id } });
}

export async function listCategoriesWithCounts() {
  // Usar la relación FK real (_count.products) para obtener conteos precisos
  const categories = await prisma.productCategory.findMany({
    orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    select: {
      id: true, name: true, label: true, icon: true,
      color: true, sort_order: true, active: true, created_at: true,
      _count: { select: { products: true } },
    },
  });

  return categories.map(cat => ({
    id: cat.id, name: cat.name, label: cat.label, icon: cat.icon,
    color: cat.color, sort_order: cat.sort_order, active: cat.active,
    created_at: cat.created_at,
    product_count: cat._count.products,
  }));
}
