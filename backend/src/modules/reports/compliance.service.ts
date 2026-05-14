import { prisma } from '../../lib/prisma.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';

// ── KPIs Dashboard Ley 2120 ─────────────────────────────────────────────────

export async function getComplianceDashboard(actor: JwtPayload) {
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role)) throw new AppError('No autorizado', 403);

  const [
    totalProducts, activeProducts,
    level1Count, level2Count,
    totalOrders, sealFreeOrders,
    avgScore, sweetenerOrders,
    supplierStats, recentAudits,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { nutritional_level: 'LEVEL_1', active: true } }),
    prisma.product.count({ where: { nutritional_level: 'LEVEL_2', active: true } }),
    prisma.lunchOrder.count(),
    prisma.lunchOrder.count({ where: { is_seal_free: true } }),
    prisma.lunchOrder.aggregate({ _avg: { compliance_score: true } }),
    prisma.lunchOrder.count({ where: { has_sweetener_alert: true } }),
    // Proveedores con fichas técnicas
    Promise.all([
      prisma.supplier.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true, is_verified: true } }),
      prisma.supplier.count({
        where: {
          active: true,
          OR: [
            { tech_sheet_url: null },
            { tech_sheet_uploaded_at: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
    ]),
    // Auditorías recientes (últimos 30 días)
    prisma.product.count({
      where: {
        last_nutritional_audit: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const [totalSuppliers, verifiedSuppliers, expiredSheets] = supplierStats;
  const pctSealFree = activeProducts > 0 ? Math.round((level1Count / activeProducts) * 100) : 0;
  const pctOrdersCompliant = totalOrders > 0 ? Math.round((sealFreeOrders / totalOrders) * 100) : 0;

  // Distribución de sellos activos
  const sealDistribution = await prisma.product.findMany({
    where: { active: true, nutritional_level: 'LEVEL_2' },
    select: {
      seal_sodium: true, seal_sugars: true,
      seal_saturated_fat: true, seal_trans_fat: true, seal_sweeteners: true,
    },
  });

  const sealCounts = sealDistribution.reduce((acc, p) => ({
    sodium:        acc.sodium        + (p.seal_sodium        ? 1 : 0),
    sugars:        acc.sugars        + (p.seal_sugars        ? 1 : 0),
    saturated_fat: acc.saturated_fat + (p.seal_saturated_fat ? 1 : 0),
    trans_fat:     acc.trans_fat     + (p.seal_trans_fat     ? 1 : 0),
    sweeteners:    acc.sweeteners    + (p.seal_sweeteners    ? 1 : 0),
  }), { sodium: 0, sugars: 0, saturated_fat: 0, trans_fat: 0, sweeteners: 0 });

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      level1: level1Count,
      level2: level2Count,
      pct_seal_free: pctSealFree,
      recent_audits_30d: recentAudits,
    },
    orders: {
      total: totalOrders,
      seal_free: sealFreeOrders,
      sweetener_alerts: sweetenerOrders,
      pct_compliant: pctOrdersCompliant,
      avg_compliance_score: Math.round(avgScore._avg.compliance_score ?? 100),
    },
    suppliers: {
      total: totalSuppliers,
      verified: verifiedSuppliers,
      expired_tech_sheets: expiredSheets,
      pct_verified: totalSuppliers > 0 ? Math.round((verifiedSuppliers / totalSuppliers) * 100) : 0,
    },
    seal_distribution: sealCounts,
    generated_at: new Date().toISOString(),
  };
}

// ── Certificado de Cumplimiento por Orden ────────────────────────────────────

export async function getOrderComplianceCertificate(orderId: string, actor: JwtPayload) {
  const order = await prisma.lunchOrder.findUnique({
    where: { id: orderId },
    include: {
      student: { include: { school: true } },
      store: true,
      items: {
        include: {
          store_product: {
            include: {
              product: {
                select: {
                  name: true, nutritional_level: true,
                  seal_sodium: true, seal_sugars: true, seal_saturated_fat: true,
                  seal_trans_fat: true, seal_sweeteners: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) throw new AppError('Pedido no encontrado', 404);

  // Verificar acceso
  if (actor.role === 'PARENT') {
    const student = await prisma.student.findFirst({ where: { id: order.student_id, user_id: actor.sub } });
    if (!student) throw new AppError('No autorizado', 403);
  }

  type ItemWithProduct = {
    quantity: number;
    store_product: {
      product: {
        name: string; nutritional_level: string;
        seal_sodium: boolean; seal_sugars: boolean; seal_saturated_fat: boolean;
        seal_trans_fat: boolean; seal_sweeteners: boolean;
      };
    };
  };

  const items = (order.items as ItemWithProduct[]).map(item => ({
    product_name: item.store_product.product.name,
    quantity: item.quantity,
    nutritional_level: item.store_product.product.nutritional_level,
    seals: {
      sodium:        item.store_product.product.seal_sodium,
      sugars:        item.store_product.product.seal_sugars,
      saturated_fat: item.store_product.product.seal_saturated_fat,
      trans_fat:     item.store_product.product.seal_trans_fat,
      sweeteners:    item.store_product.product.seal_sweeteners,
    },
  }));

  return {
    certificate: {
      order_id:         order.id,
      issued_at:        new Date().toISOString(),
      legal_framework:  'Ley 2120 de 2021 — Resolución 2492 de 2022',
      platform:         'CASPETE.COM',
    },
    order: {
      scheduled_date:      order.scheduled_date,
      status:              order.status,
      is_seal_free:        order.is_seal_free,
      has_sweetener_alert: order.has_sweetener_alert,
      compliance_score:    order.compliance_score,
      seal_summary:        order.seal_summary,
    },
    student: {
      name:   order.student.full_name,
      grade:  order.student.grade,
      school: order.student.school.name,
      city:   order.student.school.city,
    },
    store:  { name: order.store.name },
    items,
    compliance_statement: order.is_seal_free
      ? 'CONFORME — Esta lonchera no contiene productos con sellos de advertencia según la Ley 2120 de 2021.'
      : `NO CONFORME — Esta lonchera contiene ${(items as { nutritional_level: string }[]).filter(i => i.nutritional_level === 'LEVEL_2').length} producto(s) con sellos de advertencia. Puntaje de cumplimiento: ${order.compliance_score}/100.`,
  };
}
