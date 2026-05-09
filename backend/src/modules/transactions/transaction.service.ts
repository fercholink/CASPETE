import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const txSelect = {
  id: true,
  type: true,
  amount: true,
  balance_after: true,
  payment_method: true,
  created_at: true,
  order: { select: { id: true, scheduled_date: true, total_amount: true } },
} as const;

async function assertStudentAccess(studentId: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parent_id: true, school_id: true, active: true },
  });
  if (!student?.active) throw new AppError('Estudiante no encontrado', 404);
  if (actor.role === 'SUPER_ADMIN') return student;
  if (actor.role === 'PARENT' && student.parent_id !== actor.sub)
    throw new AppError('No tienes acceso a este estudiante', 403);
  if ((actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') && actor.schoolId !== student.school_id)
    throw new AppError('No tienes acceso a este estudiante', 403);
  return student;
}

export async function listTransactions(studentId: string, actor: JwtPayload) {
  await assertStudentAccess(studentId, actor);
  return prisma.transaction.findMany({
    where: { student_id: studentId },
    orderBy: { created_at: 'desc' },
    take: 100,
    select: txSelect,
  });
}
