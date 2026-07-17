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

// ─── Resumen para Administrador de Colegio (SCHOOL_ADMIN) ──────────────
export async function getSchoolSummary(actor: JwtPayload) {
  if (actor.role !== 'SCHOOL_ADMIN') {
    throw new AppError('Solo para administradores de colegio', 403);
  }
  const schoolId = actor.schoolId!;
  const { start, end } = todayRange();
  
  // Date ranges
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const yearStart = new Date(start.getFullYear(), 0, 1);

  const [
    ordersToday, ordersPending, ordersConfirmed, ordersDelivered,
    revenueToday, revenueMonth, activeStudents, topProductsRaw, stores, schoolInfo
  ] = await Promise.all([
    prisma.lunchOrder.count({ where: { school_id: schoolId, created_at: { gte: start, lte: end } } }),
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'PENDING' } }),
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'CONFIRMED' } }),
    prisma.lunchOrder.count({ where: { school_id: schoolId, status: 'DELIVERED', delivered_at: { gte: start, lte: end } } }),
    prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', created_at: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.student.count({ where: { school_id: schoolId, active: true } }),
    prisma.orderItem.groupBy({
      by: ['store_product_id'],
      where: { order: { school_id: schoolId, created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.store.findMany({ where: { school_id: schoolId } }),
    prisma.school.findUnique({ where: { id: schoolId }, select: { acquisition_model: true, commission_rate: true, monthly_fee: true } })
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

  const storesPerformance = await Promise.all(stores.map(async (store) => {
    const [revToday, revMonth, revYear] = await Promise.all([
      prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', order: { store_id: store.id }, created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', order: { store_id: store.id }, created_at: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { school_id: schoolId, type: 'CHARGE', order: { store_id: store.id }, created_at: { gte: yearStart } }, _sum: { amount: true } })
    ]);
    return {
      store_id: store.id,
      name: store.name,
      revenue_today: revToday._sum.amount?.toNumber() ?? 0,
      revenue_month: revMonth._sum.amount?.toNumber() ?? 0,
      revenue_year: revYear._sum.amount?.toNumber() ?? 0,
    };
  }));

  return {
    orders_today: ordersToday, orders_pending: ordersPending,
    orders_confirmed: ordersConfirmed, orders_delivered_today: ordersDelivered,
    revenue_today: revenueToday._sum.amount?.toNumber() ?? 0,
    revenue_month: revenueMonth._sum.amount?.toNumber() ?? 0,
    active_students: activeStudents, top_products: topProducts,
    stores_performance: storesPerformance,
    acquisition_model: schoolInfo?.acquisition_model ?? 'COMMISSION',
    commission_rate: schoolInfo?.commission_rate?.toNumber() ?? 5,
    monthly_fee: schoolInfo?.monthly_fee?.toNumber() ?? 200000,
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

// ─── Ingresos por colegio — detalle completo (SUPER_ADMIN) ───────────
export async function getSchoolsRevenueReport(actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo para Super Admin', 403);

  const { start, end } = todayRange();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const schools = await prisma.school.findMany({
    select: {
      id: true, name: true, city: true, active: true, plan: true,
      _count: { select: { students: true } },
    },
    orderBy: { name: 'asc' },
  });

  const rows = await Promise.all(schools.map(async (school) => {
    const [revToday, revMonth, revYear, ordersMonth] = await Promise.all([
      prisma.transaction.aggregate({ where: { school_id: school.id, type: 'CHARGE', created_at: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { school_id: school.id, type: 'CHARGE', created_at: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { school_id: school.id, type: 'CHARGE', created_at: { gte: yearStart } }, _sum: { amount: true } }),
      prisma.lunchOrder.count({ where: { school_id: school.id, created_at: { gte: monthStart }, status: { not: 'CANCELLED' } } }),
    ]);
    return {
      school_id: school.id,
      name: school.name,
      city: school.city,
      active: school.active,
      plan: school.plan,
      students_count: school._count.students,
      orders_month: ordersMonth,
      revenue_today: revToday._sum.amount?.toNumber() ?? 0,
      revenue_month: revMonth._sum.amount?.toNumber() ?? 0,
      revenue_year: revYear._sum.amount?.toNumber() ?? 0,
    };
  }));

  return rows.sort((a, b) => b.revenue_month - a.revenue_month);
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

// ─── Auditoría "Pensión Incluida" (Fase 4) — comidas entregadas vs. matriculados ───
// Ayuda al colegio a auditar a su proveedor de alimentación: cuántas comidas
// cubiertas por la pensión se entregaron por día, cruzado con asistencia QR
// (si el colegio la tiene habilitada) y un costo estimado si cargó cost_per_meal.

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getPensionAuditReport(actor: JwtPayload, schoolId: string, month: number, year: number) {
  if (actor.role !== 'SUPER_ADMIN' && actor.schoolId !== schoolId) {
    throw new AppError('No tienes permiso para el reporte de este colegio', 403);
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, meal_payment_model: true, cost_per_meal: true },
  });
  if (!school) throw new AppError('Colegio no encontrado', 404);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));

  const [enrolledStudents, deliveredOrders, attendances] = await Promise.all([
    prisma.student.count({ where: { school_id: schoolId, active: true } }),
    // "Comida incluida entregada": pedido con status DELIVERED y charged_amount=0
    // (100% cubierto por la pensión — sin ítems "extra" mezclados).
    prisma.lunchOrder.findMany({
      where: { school_id: schoolId, status: 'DELIVERED', charged_amount: 0, scheduled_date: { gte: start, lt: end } },
      select: { scheduled_date: true },
    }),
    prisma.attendance.findMany({
      where: { student: { school_id: schoolId }, scanned_at: { gte: start, lt: end } },
      select: { student_id: true, scanned_at: true },
    }),
  ]);

  const mealsByDate = new Map<string, number>();
  for (const o of deliveredOrders) {
    const key = o.scheduled_date.toISOString().slice(0, 10); // @db.Date: ya es medianoche UTC del día correcto
    mealsByDate.set(key, (mealsByDate.get(key) ?? 0) + 1);
  }

  const attendanceByDate = new Map<string, Set<string>>();
  for (const a of attendances) {
    const key = localDateKey(a.scanned_at); // scanned_at es timestamp real — usar fecha local del servidor (Bogotá)
    if (!attendanceByDate.has(key)) attendanceByDate.set(key, new Set());
    attendanceByDate.get(key)!.add(a.student_id);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      date: key,
      meals_delivered: mealsByDate.get(key) ?? 0,
      attendance_count: attendanceByDate.get(key)?.size ?? 0,
    };
  });

  const daysWithMeals = days.filter((d) => d.meals_delivered > 0);
  const totalMeals = daysWithMeals.reduce((s, d) => s + d.meals_delivered, 0);
  const avgMealsPerDay = daysWithMeals.length > 0 ? Math.round((totalMeals / daysWithMeals.length) * 10) / 10 : 0;
  const costPerMeal = school.cost_per_meal?.toNumber() ?? null;
  const estimatedCost = costPerMeal !== null ? Math.round(totalMeals * costPerMeal * 100) / 100 : null;

  return {
    school: {
      id: school.id, name: school.name,
      meal_payment_model: school.meal_payment_model,
      cost_per_meal: costPerMeal,
    },
    enrolled_students: enrolledStudents,
    total_meals_delivered: totalMeals,
    avg_meals_per_day: avgMealsPerDay,
    estimated_cost: estimatedCost,
    has_attendance_data: attendances.length > 0,
    days,
  };
}
