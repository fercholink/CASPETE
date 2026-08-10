import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateGpsPaymentInput } from './gps-payment.schemas.js';

// Plan "solo localizar y llamar" (School.is_gps_only) — precios fijos, no
// configurables desde la app todavía.
export const GPS_DEVICE_PRICE = 120000;
export const GPS_MONTHLY_PRICE = 25000;

const paymentSelect = {
  id: true, tracker_id: true, parent_id: true, type: true, amount: true,
  receipt_url: true, payment_reference: true, status: true, period_end: true,
  created_at: true, updated_at: true,
  tracker: { select: { id: true, device_name: true, student: { select: { full_name: true } } } },
  parent: { select: { full_name: true, email: true } },
} as const;

async function assertGpsOnlyTrackerOwnedByParent(trackerId: string, actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id: trackerId },
    select: {
      id: true, subscription_paid_until: true,
      student: { select: { parent_id: true, school: { select: { is_gps_only: true } } } },
    },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (tracker.student?.parent_id !== actor.sub) throw new AppError('No tienes permiso sobre este localizador', 403);
  if (!tracker.student.school.is_gps_only) {
    throw new AppError('Este cobro solo aplica para localizadores sin colegio afiliado', 400);
  }
  return tracker;
}

export async function createGpsPaymentRequest(input: CreateGpsPaymentInput, actor: JwtPayload) {
  await assertGpsOnlyTrackerOwnedByParent(input.trackerId, actor);

  const amount = input.type === 'DEVICE' ? GPS_DEVICE_PRICE : GPS_MONTHLY_PRICE;

  return prisma.gPSPaymentRequest.create({
    data: {
      tracker_id: input.trackerId,
      parent_id: actor.sub,
      type: input.type,
      amount,
      receipt_url: input.receiptUrl,
      payment_reference: input.paymentReference ?? null,
    },
    select: paymentSelect,
  });
}

export async function listGpsPaymentRequests(
  actor: JwtPayload,
  opts: { status?: string; page?: number; limit?: number } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;

  if (actor.role === 'PARENT') {
    where.parent_id = actor.sub;
  } else if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permiso', 403);
  }

  const [requests, total] = await Promise.all([
    prisma.gPSPaymentRequest.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit, select: paymentSelect }),
    prisma.gPSPaymentRequest.count({ where }),
  ]);
  return { requests, total, page, pages: Math.ceil(total / limit) };
}

export async function getGpsSubscriptionStatus(trackerId: string, actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id: trackerId },
    select: {
      device_purchased: true, subscription_paid_until: true,
      student: { select: { parent_id: true, school: { select: { is_gps_only: true } } } },
    },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso', 403);
  }

  const now = new Date();
  const subscriptionActive = Boolean(tracker.subscription_paid_until && tracker.subscription_paid_until > now);

  return {
    is_gps_only_plan: tracker.student?.school.is_gps_only ?? false,
    device_purchased: tracker.device_purchased,
    subscription_paid_until: tracker.subscription_paid_until,
    subscription_active: subscriptionActive,
    device_price: GPS_DEVICE_PRICE,
    monthly_price: GPS_MONTHLY_PRICE,
  };
}

export async function processGpsPaymentRequest(id: string, action: 'APPROVED' | 'REJECTED', actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo el Super Administrador puede aprobar estos pagos', 403);

  const request = await prisma.gPSPaymentRequest.findUnique({
    where: { id },
    select: {
      id: true, tracker_id: true, type: true, status: true,
      tracker: { select: { subscription_paid_until: true } },
    },
  });
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  if (action === 'REJECTED') {
    return prisma.gPSPaymentRequest.update({ where: { id }, data: { status: 'REJECTED' }, select: paymentSelect });
  }

  return prisma.$transaction(async (tx) => {
    let periodEnd: Date | null = null;

    if (request.type === 'DEVICE') {
      await tx.gPSTracker.update({ where: { id: request.tracker_id }, data: { device_purchased: true } });
    } else {
      // El nuevo mes se suma a partir de lo que ya estaba pagado (si sigue vigente),
      // no desde hoy — así un pago anticipado no "pierde" días.
      const base = request.tracker.subscription_paid_until && request.tracker.subscription_paid_until > new Date()
        ? request.tracker.subscription_paid_until
        : new Date();
      periodEnd = new Date(base);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await tx.gPSTracker.update({ where: { id: request.tracker_id }, data: { subscription_paid_until: periodEnd } });
    }

    return tx.gPSPaymentRequest.update({
      where: { id },
      data: { status: 'APPROVED', ...(periodEnd && { period_end: periodEnd }) },
      select: paymentSelect,
    });
  });
}
