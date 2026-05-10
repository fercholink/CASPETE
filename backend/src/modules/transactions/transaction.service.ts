import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const txSelect = {
  id: true, type: true, amount: true, balance_after: true,
  payment_method: true, created_at: true,
  student: { select: { id: true, full_name: true } },
  order: { select: { id: true, scheduled_date: true, total_amount: true } },
} as const;

async function assertStudentAccess(studentId: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parent_id: true, school_id: true, active: true },
  });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (actor.role === 'SUPER_ADMIN') return student;
  if (actor.role === 'PARENT' && student.parent_id !== actor.sub)
    throw new AppError('No tienes acceso a este estudiante', 403);
  if ((actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') && actor.schoolId !== student.school_id)
    throw new AppError('No tienes acceso a este estudiante', 403);
  return student;
}

export async function listTransactions(
  studentId: string,
  actor: JwtPayload,
  opts: { page?: number; limit?: number; type?: string } = {},
) {
  await assertStudentAccess(studentId, actor);
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { student_id: studentId };
  if (opts.type) where.type = opts.type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit, select: txSelect }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, pages: Math.ceil(total / limit) };
}

export async function getTransactionStats(studentId: string, actor: JwtPayload) {
  await assertStudentAccess(studentId, actor);

  const [total, topups, charges, refunds, totalTopup, totalCharge] = await Promise.all([
    prisma.transaction.count({ where: { student_id: studentId } }),
    prisma.transaction.count({ where: { student_id: studentId, type: 'TOPUP' } }),
    prisma.transaction.count({ where: { student_id: studentId, type: 'CHARGE' } }),
    prisma.transaction.count({ where: { student_id: studentId, type: 'REFUND' } }),
    prisma.transaction.aggregate({ where: { student_id: studentId, type: 'TOPUP' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { student_id: studentId, type: 'CHARGE' }, _sum: { amount: true } }),
  ]);

  return {
    total, topups, charges, refunds,
    totalTopup: totalTopup._sum.amount?.toString() ?? '0',
    totalCharge: totalCharge._sum.amount?.toString() ?? '0',
  };
}
