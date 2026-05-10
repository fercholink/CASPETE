import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { CreateSchoolInput, UpdateSchoolInput } from './school.schemas.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

// ─── Select completo para respuestas ───

const schoolSelect = {
  id: true,
  name: true,
  nit: true,
  city: true,
  department: true,
  address: true,
  phone: true,
  email: true,
  logo_url: true,
  plan: true,
  active: true,
  created_at: true,
  _count: { select: { users: true, students: true, stores: true, lunch_orders: true } },
} as const;

// ─── CRUD ───

export async function createSchool(input: CreateSchoolInput) {
  if (input.nit) {
    const existing = await prisma.school.findUnique({ where: { nit: input.nit } });
    if (existing) throw new AppError('Ya existe un colegio con ese NIT', 409);
  }
  return prisma.school.create({
    data: {
      name: input.name,
      city: input.city,
      plan: input.plan,
      nit: input.nit ?? null,
      department: input.department ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      logo_url: input.logo_url ?? null,
    },
    select: schoolSelect,
  });
}

export async function listSchools(
  page: number,
  limit: number,
  filters?: { search?: string; city?: string; plan?: string; active?: string },
) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Búsqueda global (nombre, NIT, ciudad)
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { nit: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters?.plan) where.plan = filters.plan;
  if (filters?.active !== undefined) where.active = filters.active === 'true';

  const [schools, total] = await prisma.$transaction([
    prisma.school.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: schoolSelect,
    }),
    prisma.school.count({ where }),
  ]);
  return { schools, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getSchool(id: string) {
  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      ...schoolSelect,
      stores: {
        select: { id: true, name: true, active: true, _count: { select: { store_products: true, lunch_orders: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!school) throw new AppError('Colegio no encontrado', 404);
  return school;
}

export async function updateSchool(id: string, input: UpdateSchoolInput) {
  await getSchool(id);
  if (input.nit) {
    const conflict = await prisma.school.findFirst({
      where: { nit: input.nit, id: { not: id } },
    });
    if (conflict) throw new AppError('Ya existe un colegio con ese NIT', 409);
  }
  return prisma.school.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.plan !== undefined && { plan: input.plan }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.nit !== undefined && { nit: input.nit }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.logo_url !== undefined && { logo_url: input.logo_url }),
    },
    select: schoolSelect,
  });
}

export async function listActiveSchools() {
  return prisma.school.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, city: true, department: true, plan: true },
  });
}

// ─── Estadísticas de un colegio ───

export async function getSchoolStats(id: string) {
  const school = await prisma.school.findUnique({ where: { id }, select: { id: true } });
  if (!school) throw new AppError('Colegio no encontrado', 404);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    activeStudents,
    totalStores,
    ordersToday,
    ordersThisMonth,
    revenueToday,
    revenueThisMonth,
    totalBalance,
  ] = await prisma.$transaction([
    prisma.student.count({ where: { school_id: id } }),
    prisma.student.count({ where: { school_id: id, active: true } }),
    prisma.store.count({ where: { school_id: id, active: true } }),
    prisma.lunchOrder.count({ where: { school_id: id, created_at: { gte: startOfToday } } }),
    prisma.lunchOrder.count({ where: { school_id: id, created_at: { gte: startOfMonth } } }),
    prisma.lunchOrder.aggregate({
      where: { school_id: id, created_at: { gte: startOfToday }, status: { not: 'CANCELLED' } },
      _sum: { total_amount: true },
    }),
    prisma.lunchOrder.aggregate({
      where: { school_id: id, created_at: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
      _sum: { total_amount: true },
    }),
    prisma.student.aggregate({
      where: { school_id: id, active: true },
      _sum: { balance: true },
    }),
  ]);

  return {
    total_students: totalStudents,
    active_students: activeStudents,
    total_stores: totalStores,
    orders_today: ordersToday,
    orders_this_month: ordersThisMonth,
    revenue_today: revenueToday._sum.total_amount?.toNumber() ?? 0,
    revenue_this_month: revenueThisMonth._sum.total_amount?.toNumber() ?? 0,
    total_student_balance: totalBalance._sum.balance?.toNumber() ?? 0,
  };
}

// ─── Desactivar / Eliminar ───

export async function deactivateSchool(id: string) {
  await getSchool(id);
  return prisma.school.update({
    where: { id },
    data: { active: false },
    select: schoolSelect,
  });
}

export async function reactivateSchool(id: string) {
  await getSchool(id);
  return prisma.school.update({
    where: { id },
    data: { active: true },
    select: schoolSelect,
  });
}

export async function deleteSchool(id: string) {
  const school = await prisma.school.findUnique({
    where: { id },
    include: { _count: { select: { users: true, students: true, stores: true } } },
  });
  if (!school) throw new AppError('Colegio no encontrado', 404);

  // Eliminación en cascada completa
  await prisma.$transaction([
    // 1. OrderItems de pedidos de este colegio
    prisma.orderItem.deleteMany({ where: { order: { school_id: id } } }),
    // 2. Transacciones
    prisma.transaction.deleteMany({ where: { school_id: id } }),
    // 3. Pedidos
    prisma.lunchOrder.deleteMany({ where: { school_id: id } }),
    // 4. StoreProducts de tiendas de este colegio
    prisma.storeProduct.deleteMany({ where: { store: { school_id: id } } }),
    // 5. Tiendas
    prisma.store.deleteMany({ where: { school_id: id } }),
    // 6. TopupRequests
    prisma.topupRequest.deleteMany({ where: { school_id: id } }),
    // 7. Estudiantes
    prisma.student.deleteMany({ where: { school_id: id } }),
    // 8. Tokens de usuarios de este colegio
    prisma.refreshToken.deleteMany({ where: { user: { school_id: id } } }),
    prisma.passwordResetToken.deleteMany({ where: { user: { school_id: id } } }),
    // 9. Usuarios
    prisma.user.deleteMany({ where: { school_id: id } }),
    // 10. El colegio
    prisma.school.delete({ where: { id } }),
  ]);
}
