import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Resumen diario (SCHOOL_ADMIN / SUPER_ADMIN) ──────────────
export async function getSummary(actor: JwtPayload) {
  if (actor.role === 'PARENT' || actor.role === 'VENDOR') {
    throw new AppError('No tienes acceso a los reportes', 403);
  }
  const schoolFilter = actor.role === 'SUPER_ADMIN' ? {} : { school_id: actor.schoolId! };
  const { start, end } = todayRange();

  const [
    ordersToday, ordersPending, ordersConfirmed, ordersDelivered,
    revenueResult, activeStudents, topProductsRaw,
  ] = await Promise.all([
    prisma.lunchOrder.count({ where: { ...schoolFilter, created_at: { gte: start, lte: end } } }),
    prisma.lunchOrder.count({ where: { ...schoolFilter, status: 'PENDING' } }),
    prisma.lunchOrder.count({ where: { ...schoolFilter, status: 'CONFIRMED' } }),
    prisma.lunchOrder.count({ where: { ...schoolFilter, status: 'DELIVERED', delivered_at: { gte: start, lte: end } } }),
    prisma.transaction.aggregate({ where: { ...schoolFilter, type: 'CHARGE', created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.student.count({ where: { ...schoolFilter, active: true } }),
    prisma.orderItem.groupBy({
      by: ['store_product_id'],
      where: { order: { ...schoolFilter, created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const spIds = topProductsRaw.map(r => r.store_product_id);
  const storeProducts = await prisma.storeProduct.findMany({
    where: { id: { in: spIds } },
    select: { id: true, product: { select: { id: true, name: true, base_price: true } } },
  });
  const spMap = new Map(storeProducts.map(sp => [sp.id, sp]));
  const topProducts = topProductsRaw.map(r => ({
    product_id: spMap.get(r.store_product_id)?.product.id ?? r.store_product_id,
    name: spMap.get(r.store_product_id)?.product.name ?? 'Desconocido',
    price: spMap.get(r.store_product_id)?.product.base_price ?? '0',
    total_qty: r._sum?.quantity ?? 0,
  }));

  return {
    orders_today: ordersToday, orders_pending: ordersPending,
    orders_confirmed: ordersConfirmed, orders_delivered_today: ordersDelivered,
    revenue_today: revenueResult._sum.amount?.toNumber() ?? 0,
    active_students: activeStudents, top_products: topProducts,
  };
}

// ─── Métricas globales (SUPER_ADMIN) ──────────────────────────
export async function getGlobalStats(actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo para Super Admin', 403);
  const { start, end } = todayRange();

  const [
    totalSchools, activeSchools,
    totalStudents, activeStudents,
    pendingTopups, revenueToday, revenueMonth,
    ordersToday, schoolsRaw,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { active: true } }),
    prisma.student.count(),
    prisma.student.count({ where: { active: true } }),
    prisma.topupRequest.count({ where: { status: 'PENDING' } }),
    prisma.transaction.aggregate({ where: { type: 'CHARGE', created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'CHARGE', created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amount: true } }),
    prisma.lunchOrder.count({ where: { created_at: { gte: start, lte: end } } }),
    // Top colegios por ingresos del mes
    prisma.transaction.groupBy({
      by: ['school_id'], where: { type: 'CHARGE', created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 5,
    }),
  ]);

  const schoolIds = schoolsRaw.map(s => s.school_id);
  const schools = await prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true } });
  const schoolMap = new Map(schools.map(s => [s.id, s]));
  const topSchools = schoolsRaw.map(s => ({
    school_id: s.school_id,
    name: schoolMap.get(s.school_id)?.name ?? 'Desconocido',
    revenue: s._sum.amount?.toNumber() ?? 0,
  }));

  return {
    schools: { total: totalSchools, active: activeSchools },
    students: { total: totalStudents, active: activeStudents },
    pending_topups: pendingTopups,
    revenue: { today: revenueToday._sum.amount?.toNumber() ?? 0, month: revenueMonth._sum.amount?.toNumber() ?? 0 },
    orders_today: ordersToday,
    top_schools: topSchools,
  };
}

// ─── Resumen para padres ───────────────────────────────────────
export async function getParentSummary(actor: JwtPayload) {
  if (actor.role !== 'PARENT') throw new AppError('Solo para padres', 403);
  const { start, end } = todayRange();

  // Find student IDs for this parent
  const studentIds = (await prisma.student.findMany({
    where: { parent_id: actor.sub, active: true },
    select: { id: true },
  })).map(s => s.id);

  const [students, recentOrders, pendingTopups] = await Promise.all([
    prisma.student.findMany({
      where: { parent_id: actor.sub, active: true },
      select: { id: true, full_name: true, grade: true, balance: true, school: { select: { name: true } } },
    }),
    prisma.lunchOrder.findMany({
      where: { student_id: { in: studentIds } },
      orderBy: { created_at: 'desc' }, take: 5,
      select: { id: true, status: true, total_amount: true, created_at: true, student: { select: { full_name: true } } },
    }),
    prisma.topupRequest.count({ where: { parent_id: actor.sub, status: 'PENDING' } }),
  ]);

  const totalBalance = students.reduce((acc, s) => acc + s.balance.toNumber(), 0);

  // Pedidos de hoy de sus hijos
  const todayOrders = await prisma.lunchOrder.count({
    where: { student_id: { in: studentIds }, created_at: { gte: start, lte: end } },
  });

  return { students, total_balance: totalBalance, recent_orders: recentOrders, pending_topups: pendingTopups, today_orders: todayOrders };
}

// ─── Resumen para vendor ───────────────────────────────────────
export async function getVendorSummary(actor: JwtPayload) {
  if (actor.role !== 'VENDOR') throw new AppError('Solo para vendedores', 403);
  const { start, end } = todayRange();

  const schoolId = actor.schoolId;
  if (!schoolId) throw new AppError('Sin colegio asignado', 400);

  const [pendingOrders, confirmedOrders, deliveredToday, revenueToday, topProducts] = await Promise.all([
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'PENDING' } }),
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'CONFIRMED' } }),
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'DELIVERED', delivered_at: { gte: start, lte: end } } }),
    prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.orderItem.groupBy({
      by: ['store_product_id'],
      where: { order: { school_id: schoolId, created_at: { gte: start, lte: end }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5,
    }),
  ]);

  const spIds = topProducts.map(p => p.store_product_id);
  const storeProducts = await prisma.storeProduct.findMany({
    where: { id: { in: spIds } },
    select: { id: true, product: { select: { id: true, name: true } } },
  });
  const spMap = new Map(storeProducts.map(sp => [sp.id, sp]));

  return {
    pending_orders: pendingOrders,
    confirmed_orders: confirmedOrders,
    delivered_today: deliveredToday,
    revenue_today: revenueToday._sum.amount?.toNumber() ?? 0,
    top_products_today: topProducts.map(p => ({ name: spMap.get(p.store_product_id)?.product.name ?? 'N/A', qty: p._sum?.quantity ?? 0 })),
  };
}
