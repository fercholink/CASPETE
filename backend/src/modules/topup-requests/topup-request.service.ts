import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { sendTopupConfirmationEmail } from '../../lib/email.js';

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
    },
  });
}

export async function listTopupRequests(actor: JwtPayload, status?: string) {
  if (actor.role === 'PARENT') {
    return prisma.topupRequest.findMany({
      where: { parent_id: actor.sub, ...(status && { status: status as any }) },
      orderBy: { created_at: 'desc' },
      include: { student: { select: { full_name: true } } },
    });
  }

  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    return prisma.topupRequest.findMany({
      where: { school_id: actor.schoolId!, ...(status && { status: status as any }) },
      orderBy: { created_at: 'desc' },
      include: { 
        student: { select: { full_name: true } },
        parent: { select: { full_name: true, email: true } },
      },
    });
  }

  return prisma.topupRequest.findMany({
    where: { ...(status && { status: status as any }) },
    orderBy: { created_at: 'desc' },
    include: { 
      student: { select: { full_name: true } },
      parent: { select: { full_name: true, email: true } },
      school: { select: { name: true } },
    },
  });
}

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
    return prisma.topupRequest.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  // Si es aprobado, llamamos a la lógica principal de recarga
  const result = await confirmTopup({
    studentId: request.student_id,
    amount: request.amount.toNumber(),
    paymentMethod: 'TRANSFERENCIA',
    gatewayRef: request.id,
  });

  await prisma.topupRequest.update({ where: { id }, data: { status: 'APPROVED' } });
  return result;
}

export async function confirmTopup(input: ConfirmTopupInput) {
  const { studentId, amount, paymentMethod, gatewayRef } = input;

  const existing = await prisma.transaction.findFirst({
    where: { gateway_ref: gatewayRef, type: 'TOPUP' },
  });
  if (existing) throw new AppError('Esta transacción ya fue procesada anteriormente', 409);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      school_id: true,
      active: true,
      balance: true,
      full_name: true,
      parent: { select: { email: true, full_name: true } },
    },
  });
  if (!student?.active) throw new AppError('Estudiante no encontrado o inactivo', 404);

  const newBalance = Math.round((student.balance.toNumber() + amount) * 100) / 100;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
      select: {
        id: true,
        full_name: true,
        balance: true,
        school: { select: { name: true } },
      },
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
      student.parent.email,
      student.parent.full_name,
      student.full_name,
      amount,
      newBalance,
      paymentMethod,
    );
  } catch {
    // El fallo de email no revierte la recarga
  }

  return result;
}
