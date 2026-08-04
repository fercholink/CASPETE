import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const chargeSelect = {
  id: true, supplier_id: true, period: true, amount: true, status: true,
  paid_at: true, created_at: true,
  supplier: { select: { id: true, name: true, contact_email: true } },
} as const;

function requireSuperAdmin(actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('No autorizado', 403);
}

/**
 * Genera los cobros del periodo para todo proveedor activo con tarifa de
 * listado configurada (listing_fee_monthly > 0) y al menos un producto activo
 * listado. Idempotente: un proveedor ya cobrado en ese periodo se omite
 * (constraint único supplier_id+period).
 */
export async function generateMonthlyCharges(period: string, actor: JwtPayload) {
  requireSuperAdmin(actor);

  const suppliers = await prisma.supplier.findMany({
    where: {
      active: true,
      listing_fee_monthly: { gt: 0 },
      products: { some: { active: true } },
    },
    select: { id: true, listing_fee_monthly: true },
  });

  if (suppliers.length === 0) return { created: 0, skipped: 0, total: 0 };

  const result = await prisma.supplierCharge.createMany({
    data: suppliers.map((s) => ({
      supplier_id: s.id,
      period,
      amount: s.listing_fee_monthly,
    })),
    skipDuplicates: true,
  });

  return { created: result.count, skipped: suppliers.length - result.count, total: suppliers.length };
}

export async function listCharges(
  actor: JwtPayload,
  opts: { supplier_id?: string; status?: string; period?: string; page?: number; limit?: number } = {},
) {
  requireSuperAdmin(actor);

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (opts.supplier_id) where.supplier_id = opts.supplier_id;
  if (opts.status) where.status = opts.status;
  if (opts.period) where.period = opts.period;

  const [charges, total] = await Promise.all([
    prisma.supplierCharge.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit, select: chargeSelect }),
    prisma.supplierCharge.count({ where }),
  ]);

  return { charges, total, page, pages: Math.ceil(total / limit) };
}

export async function markChargePaid(id: string, actor: JwtPayload) {
  requireSuperAdmin(actor);

  const charge = await prisma.supplierCharge.findUnique({ where: { id }, select: chargeSelect });
  if (!charge) throw new AppError('Cobro no encontrado', 404);
  if (charge.status !== 'PENDING') throw new AppError('Este cobro ya fue procesado', 400);

  return prisma.supplierCharge.update({
    where: { id },
    data: { status: 'PAID', paid_at: new Date() },
    select: chargeSelect,
  });
}

export async function cancelCharge(id: string, actor: JwtPayload) {
  requireSuperAdmin(actor);

  const charge = await prisma.supplierCharge.findUnique({ where: { id }, select: chargeSelect });
  if (!charge) throw new AppError('Cobro no encontrado', 404);
  if (charge.status !== 'PENDING') throw new AppError('Este cobro ya fue procesado', 400);

  return prisma.supplierCharge.update({
    where: { id },
    data: { status: 'CANCELLED' },
    select: chargeSelect,
  });
}

export async function getChargeStats(actor: JwtPayload) {
  requireSuperAdmin(actor);

  const [pending, paid, cancelled, pendingSum, paidSum] = await Promise.all([
    prisma.supplierCharge.count({ where: { status: 'PENDING' } }),
    prisma.supplierCharge.count({ where: { status: 'PAID' } }),
    prisma.supplierCharge.count({ where: { status: 'CANCELLED' } }),
    prisma.supplierCharge.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
    prisma.supplierCharge.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
  ]);

  return {
    pending, paid, cancelled,
    pendingAmount: pendingSum._sum.amount?.toString() ?? '0',
    paidAmount: paidSum._sum.amount?.toString() ?? '0',
  };
}
