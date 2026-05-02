import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateStudentInput, UpdateStudentInput } from './student.schemas.js';

const studentSelect = {
  id: true,
  school_id: true,
  parent_id: true,
  national_id: true,
  full_name: true,
  grade: true,
  balance: true,
  active: true,
  created_at: true,
  school: { select: { id: true, name: true, city: true } },
  parent: { select: { id: true, full_name: true, email: true } },
} as const;

function accessFilter(actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return {};
  if (actor.role === 'SCHOOL_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    return { school_id: actor.schoolId };
  }
  return { parent_id: actor.sub };
}

function assertAccess(
  student: { school_id: string; parent_id: string },
  actor: JwtPayload,
) {
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
      where: {
        school_id_national_id: {
          school_id: input.school_id,
          national_id: input.national_id,
        },
      },
    });
    if (dup) throw new AppError('Ya hay un estudiante con ese documento en este colegio', 409);
  }

  return prisma.student.create({
    data: {
      school_id: input.school_id,
      parent_id: actor.sub,
      full_name: input.full_name,
      national_id: input.national_id ?? null,
      grade: input.grade ?? null,
    },
    select: studentSelect,
  });
}

export async function listStudents(actor: JwtPayload) {
  return prisma.student.findMany({
    where: accessFilter(actor),
    orderBy: { created_at: 'desc' },
    select: studentSelect,
  });
}

export async function getStudent(id: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);
  return student;
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
  actor: JwtPayload,
) {
  const student = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  assertAccess(student, actor);

  if (input.national_id) {
    const conflict = await prisma.student.findFirst({
      where: { school_id: student.school_id, national_id: input.national_id, id: { not: id } },
    });
    if (conflict) throw new AppError('Ya hay un estudiante con ese documento en este colegio', 409);
  }

  return prisma.student.update({
    where: { id },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name }),
      ...(input.national_id !== undefined && { national_id: input.national_id }),
      ...(input.grade !== undefined && { grade: input.grade }),
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
