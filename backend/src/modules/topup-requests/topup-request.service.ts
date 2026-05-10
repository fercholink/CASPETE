import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { sendTopupConfirmationEmail } from '../../lib/email.js';
import * as nequi from '../../lib/nequi.js';

export interface ConfirmTopupInput {
  studentId: string;
  amount: number;
  paymentMethod: string;
  gatewayRef: string;
}

export interface CreateTopupRequestInput {
  studentId: string;
  amount: number;
  receiptUrl: string;
}

const topupSelect = {
  id: true, school_id: true, student_id: true, parent_id: true,
  amount: true, receipt_url: true, status: true, payment_method: true,
  nequi_transaction_id: true, created_at: true, updated_at: true,
  student: { select: { full_name: true, grade: true } },
  parent: { select: { full_name: true, email: true } },
  school: { select: { name: true } },
} as const;

// ─── Crear solicitud de recarga manual (transferencia) ─────────
export async function createTopupRequest(input: CreateTopupRequestInput, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, parent_id: true, school_id: true },
  });

  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (student.parent_id !== actor.sub) throw new AppError('No tienes permiso', 403);

  return prisma.topupRequest.create({
    data: {
      school_id: student.school_id,
      student_id: input.studentId,
      parent_id: actor.sub,
      amount: input.amount,
      receipt_url: input.receiptUrl,
      payment_method: 'TRANSFERENCIA',
    },
    select: topupSelect,
  });
}

// ─── Crear solicitud de recarga con Nequi Push ─────────────────
export async function createNequiTopupRequest(
  studentId: string,
  amount: number,
  phoneNumber: string,
  actor: JwtPayload,
) {
  if (!nequi.isConfigured()) throw new AppError('Nequi aún no está habilitado. Usa transferencia manual.', 503);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parent_id: true, school_id: true, full_name: true },
  });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (student.parent_id !== actor.sub) throw new AppError('No tienes permiso', 403);

  // Crear registro en estado PENDING_NEQUI
  const request = await prisma.topupRequest.create({
    data: {
      school_id: student.school_id,
      student_id: studentId,
      parent_id: actor.sub,
      amount,
      receipt_url: '',
      payment_method: 'NEQUI',
      status: 'PENDING',
    },
    select: topupSelect,
  });

  try {
    const nequiResult = await nequi.initiatePayment({
      phoneNumber,
      amount,
      reference1: request.id,
      reference2: student.full_name,
      reference3: `CASPETE-TOPUP`,
    });

    await prisma.topupRequest.update({
      where: { id: request.id },
      data: { nequi_transaction_id: nequiResult.transactionId },
    });

    return { request: { ...request, nequi_transaction_id: nequiResult.transactionId }, nequiStatus: 'PUSH_SENT' };
  } catch (err: any) {
    // Si Nequi falla, marcamos como REJECTED con detalle
    await prisma.topupRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' },
    });
    throw new AppError(`Error al enviar pago Nequi: ${err.message}`, 502);
  }
}

// ─── Consultar estado de pago Nequi ────────────────────────────
export async function checkNequiStatus(requestId: string, actor: JwtPayload) {
  const request = await prisma.topupRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.parent_id !== actor.sub && actor.role !== 'SUPER_ADMIN' && actor.role !== 'SCHOOL_ADMIN')
    throw new AppError('No tienes permiso', 403);
  if (request.payment_method !== 'NEQUI' || !request.nequi_transaction_id)
    throw new AppError('Esta solicitud no es de Nequi', 400);
  if (request.status !== 'PENDING')
    return { status: request.status, message: `La solicitud ya fue procesada: ${request.status}` };

  if (!nequi.isConfigured()) return { status: 'PENDING', message: 'Nequi no configurado — esperando' };

  const result = await nequi.checkPaymentStatus(request.nequi_transaction_id);

  if (result.status === 'SUCCESS') {
    // Auto-aprobar y acreditar saldo
    await processTopupRequest(requestId, 'APPROVED', { sub: 'SYSTEM', role: 'SUPER_ADMIN' } as JwtPayload);
    return { status: 'APPROVED', message: 'Pago exitoso. Saldo acreditado.' };
  }

  if (result.status === 'REJECTED' || result.status === 'EXPIRED' || result.status === 'FAILED') {
    await prisma.topupRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
    return { status: 'REJECTED', message: `Pago ${result.status.toLowerCase()} por Nequi.` };
  }

  return { status: 'PENDING', message: 'Esperando confirmación del usuario en Nequi.' };
}

// ─── Listar solicitudes con paginación ─────────────────────────
export async function listTopupRequests(
  actor: JwtPayload,
  opts: { status?: string; page?: number; limit?: number; search?: string } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.search) where.student = { full_name: { contains: opts.search, mode: 'insensitive' } };

  if (actor.role === 'PARENT') {
    where.parent_id = actor.sub;
  } else if ((actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') && actor.schoolId) {
    where.school_id = actor.schoolId;
  }

  const [requests, total] = await Promise.all([
    prisma.topupRequest.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit, select: topupSelect }),
    prisma.topupRequest.count({ where }),
  ]);

  return { requests, total, page, pages: Math.ceil(total / limit) };
}

// ─── Stats ─────────────────────────────────────────────────────
export async function getTopupStats(actor: JwtPayload) {
  const base: Record<string, unknown> = {};
  if (actor.role === 'PARENT') base.parent_id = actor.sub;
  else if ((actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') && actor.schoolId) base.school_id = actor.schoolId;

  const [total, pending, approved, rejected, totalAmount] = await Promise.all([
    prisma.topupRequest.count({ where: base }),
    prisma.topupRequest.count({ where: { ...base, status: 'PENDING' } }),
    prisma.topupRequest.count({ where: { ...base, status: 'APPROVED' } }),
    prisma.topupRequest.count({ where: { ...base, status: 'REJECTED' } }),
    prisma.topupRequest.aggregate({ where: { ...base, status: 'APPROVED' }, _sum: { amount: true } }),
  ]);

  return { total, pending, approved, rejected, totalApproved: totalAmount._sum.amount?.toString() ?? '0' };
}

// ─── Nequi configurado? ────────────────────────────────────────
export async function getNequiAvailability() {
  return { available: nequi.isConfigured() };
}

// ─── Procesar solicitud (admin) ────────────────────────────────
export async function processTopupRequest(id: string, action: 'APPROVED' | 'REJECTED', actor: JwtPayload) {
  if (actor.role === 'PARENT' || actor.role === 'VENDOR') {
    throw new AppError('No tienes permiso para aprobar recargas', 403);
  }

  const request = await prisma.topupRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitud no encontrada', 404);
  if (request.status !== 'PENDING') throw new AppError('La solicitud ya fue procesada', 400);

  if (actor.role === 'SCHOOL_ADMIN' && request.school_id !== actor.schoolId) {
    throw new AppError('No puedes aprobar solicitudes de otro colegio', 403);
  }

  if (action === 'REJECTED') {
    return prisma.topupRequest.update({ where: { id }, data: { status: 'REJECTED' }, select: topupSelect });
  }

  const result = await confirmTopup({
    studentId: request.student_id,
    amount: request.amount.toNumber(),
    paymentMethod: request.payment_method ?? 'TRANSFERENCIA',
    gatewayRef: request.id,
  });

  await prisma.topupRequest.update({ where: { id }, data: { status: 'APPROVED' } });
  return result;
}

// ─── Confirmar recarga (acreditar saldo) ───────────────────────
export async function confirmTopup(input: ConfirmTopupInput) {
  const { studentId, amount, paymentMethod, gatewayRef } = input;

  const existing = await prisma.transaction.findFirst({
    where: { gateway_ref: gatewayRef, type: 'TOPUP' },
  });
  if (existing) throw new AppError('Esta transacción ya fue procesada anteriormente', 409);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true, school_id: true, active: true, balance: true, full_name: true,
      parent: { select: { email: true, full_name: true } },
    },
  });
  if (!student?.active) throw new AppError('Estudiante no encontrado o inactivo', 404);

  const newBalance = Math.round((student.balance.toNumber() + amount) * 100) / 100;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
      select: { id: true, full_name: true, balance: true, school: { select: { name: true } } },
    });
    await tx.transaction.create({
      data: {
        school_id: student.school_id,
        student_id: studentId,
        type: 'TOPUP',
        amount,
        balance_after: newBalance,
        payment_method: paymentMethod,
        gateway_ref: gatewayRef,
      },
    });
    return updated;
  });

  try {
    await sendTopupConfirmationEmail(
      student.parent.email, student.parent.full_name,
      student.full_name, amount, newBalance, paymentMethod,
    );
    console.log(`[Email] Confirmación de recarga enviada a ${student.parent.email}`);
  } catch (emailErr) {
    console.error(`[Email] Error al enviar confirmación de recarga a ${student.parent.email}:`, emailErr);
  }

  return result;
}
