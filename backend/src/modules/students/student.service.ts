import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateStudentInput, UpdateStudentInput } from './student.schemas.js';

const studentSelect = {
  id: true, school_id: true, parent_id: true, national_id: true,
  full_name: true, grade: true, photo_url: true, balance: true,
  delivery_code: true, active: true, created_at: true,
  school: { select: { id: true, name: true, city: true } },
  parent: { select: { id: true, full_name: true, email: true } },
  _count: { select: { lunch_orders: true, transactions: true } },
} as const;

function accessFilter(actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return {};
  if (actor.role === 'SCHOOL_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    return { school_id: actor.schoolId };
  }
  return { parent_id: actor.sub };
}

function assertAccess(student: { school_id: string; parent_id: string }, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if (actor.role === 'SCHOOL_ADMIN' && actor.schoolId === student.school_id) return;
  if (actor.role === 'PARENT' && actor.sub === student.parent_id) return;
  throw new AppError('No tienes permiso para acceder a este estudiante', 403);
}

export async function createStudent(input: CreateStudentInput, actor: JwtPayload) {
  const school = await prisma.school.findUnique({ where: { id: input.school_id } });
  if (!school?.active) throw new AppError('El colegio no existe o está inactivo', 404);

  if (input.national_id) {
    const dup = await prisma.student.findUnique({
      where: { school_id_national_id: { school_id: input.school_id, national_id: input.national_id } },
    });
    if (dup) throw new AppError('Ya hay un estudiante con ese documento en este colegio', 409);
  }

  return prisma.student.create({
    data: {
      school_id: input.school_id, parent_id: actor.sub, full_name: input.full_name,
      national_id: input.national_id ?? null, grade: input.grade ?? null,
      photo_url: input.photo_url ?? null,
      delivery_code: String(Math.floor(100000 + Math.random() * 900000)).substring(0, 6),
    },
    select: studentSelect,
  });
}

export async function listStudents(
  actor: JwtPayload,
  opts: { page?: number; limit?: number; search?: string; school_id?: string; grade?: string; active?: string } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const base = accessFilter(actor);
  const where: Record<string, unknown> = { ...base };

  if (opts.school_id && actor.role === 'SUPER_ADMIN') where.school_id = opts.school_id;
  if (opts.grade) where.grade = opts.grade;
  if (opts.active !== undefined) where.active = opts.active === 'true';

  if (opts.search) {
    where.OR = [
      { full_name: { contains: opts.search, mode: 'insensitive' } },
      { national_id: { contains: opts.search, mode: 'insensitive' } },
      { parent: { full_name: { contains: opts.search, mode: 'insensitive' } } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit, select: studentSelect }),
    prisma.student.count({ where }),
  ]);

  return { students, total, page, pages: Math.ceil(total / limit) };
}

export async function getStudent(id: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);
  return student;
}

export async function updateStudent(id: string, input: UpdateStudentInput, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);

  if (input.national_id) {
    const conflict = await prisma.student.findFirst({
      where: { school_id: student.school_id, national_id: input.national_id, id: { not: id } },
    });
    if (conflict) throw new AppError('Ya hay un estudiante con ese documento en este colegio', 409);
  }

  if (input.school_id && input.school_id !== student.school_id) {
    const newSchool = await prisma.school.findUnique({ where: { id: input.school_id } });
    if (!newSchool?.active) throw new AppError('El colegio destino no existe o está inactivo', 404);
  }

  return prisma.student.update({
    where: { id },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name }),
      ...(input.school_id !== undefined && { school_id: input.school_id }),
      ...(input.national_id !== undefined && { national_id: input.national_id }),
      ...(input.grade !== undefined && { grade: input.grade }),
      ...(input.photo_url !== undefined && { photo_url: input.photo_url }),
      ...(input.delivery_code !== undefined && { delivery_code: input.delivery_code }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: studentSelect,
  });
}

export async function deactivateStudent(id: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);
  return prisma.student.update({ where: { id }, data: { active: false }, select: studentSelect });
}

export async function reactivateStudent(id: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);
  return prisma.student.update({ where: { id }, data: { active: true }, select: studentSelect });
}

export async function deleteStudent(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo el Super Administrador puede eliminar estudiantes', 403);
  const student = await prisma.student.findUnique({ where: { id }, select: { id: true, full_name: true } });
  if (!student) throw new AppError('Estudiante no encontrado', 404);

  const orders = await prisma.lunchOrder.findMany({ where: { student_id: id }, select: { id: true } });
  const orderIds = orders.map(o => o.id);

  await prisma.$transaction([
    ...(orderIds.length > 0 ? [prisma.orderItem.deleteMany({ where: { order_id: { in: orderIds } } })] : []),
    ...(orderIds.length > 0 ? [prisma.transaction.deleteMany({ where: { order_id: { in: orderIds } } })] : []),
    ...(orderIds.length > 0 ? [prisma.lunchOrder.deleteMany({ where: { id: { in: orderIds } } })] : []),
    prisma.topupRequest.deleteMany({ where: { student_id: id } }),
    prisma.transaction.deleteMany({ where: { student_id: id } }),
    prisma.student.delete({ where: { id } }),
  ]);
}

export async function getStudentStats(actor: JwtPayload) {
  const base = accessFilter(actor);
  const [total, active, inactive, totalBalance] = await Promise.all([
    prisma.student.count({ where: base }),
    prisma.student.count({ where: { ...base, active: true } }),
    prisma.student.count({ where: { ...base, active: false } }),
    prisma.student.aggregate({ where: { ...base, active: true }, _sum: { balance: true } }),
  ]);
  return { total, active, inactive, totalBalance: totalBalance._sum.balance?.toString() ?? '0' };
}
