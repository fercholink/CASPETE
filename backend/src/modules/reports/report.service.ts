import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

export async function getSummary(actor: JwtPayload) {
  if (actor.role === 'PARENT' || actor.role === 'VENDOR') {
    throw new AppError('No tienes acceso a los reportes', 403);
  }

  const schoolFilter = actor.role === 'SUPER_ADMIN' ? {} : { school_id: actor.schoolId! };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    ordersToday,
    ordersPending,
    ordersConfirmed,
    ordersDelivered,
    revenueResult,
    activeStudents,
    topProductsRaw,
  ] = await Promise.all([
    // Pedidos creados hoy
    prisma.lunchOrder.count({
      where: { ...schoolFilter, created_at: { gte: todayStart, lte: todayEnd } },
    }),
    // Pendientes de confirmar
    prisma.lunchOrder.count({ where: { ...schoolFilter, status: 'PENDING' } }),
    // Confirmados (listos para entregar)
    prisma.lunchOrder.count({ where: { ...schoolFilter, status: 'CONFIRMED' } }),
    // Entregados hoy
    prisma.lunchOrder.count({
      where: { ...schoolFilter, status: 'DELIVERED', delivered_at: { gte: todayStart, lte: todayEnd } },
    }),
    // Ingresos del día (suma CHARGE de hoy)
    prisma.transaction.aggregate({
      where: { ...schoolFilter, type: 'CHARGE', created_at: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    }),
    // Estudiantes activos
    prisma.student.count({ where: { ...schoolFilter, active: true } }),
    // Top 5 productos (por cantidad pedida en los últimos 30 días)
    prisma.orderItem.groupBy({
      by: ['product_id'],
      where: {
        order: {
          ...schoolFilter,
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  // Resolver nombres de productos
  const productIds = topProductsRaw.map((r) => r.product_id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const topProducts = topProductsRaw.map((r) => ({
    product_id: r.product_id,
    name: productMap.get(r.product_id)?.name ?? 'Desconocido',
    price: productMap.get(r.product_id)?.price ?? '0',
    total_qty: r._sum.quantity ?? 0,
  }));

  return {
    orders_today: ordersToday,
    orders_pending: ordersPending,
    orders_confirmed: ordersConfirmed,
    orders_delivered_today: ordersDelivered,
    revenue_today: revenueResult._sum.amount?.toNumber() ?? 0,
    active_students: activeStudents,
    top_products: topProducts,
  };
}
