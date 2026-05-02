import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateUserInput, UpdateUserInput } from './user.schemas.js';
import type { UserRole } from '@prisma/client';

const userSelect = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  role: true,
  active: true,
  created_at: true,
  school: { select: { id: true, name: true, city: true } },
} as const;

function assertAccess(targetUser: { school: { id: string } | null }, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if (actor.schoolId && targetUser.school?.id === actor.schoolId) return;
  throw new AppError('No tienes permiso para modificar este usuario', 403);
}

export async function createUser(input: CreateUserInput, actor: JwtPayload) {
  const schoolId = actor.role === 'SUPER_ADMIN' ? input.school_id : actor.schoolId;
  if (!schoolId) throw new AppError('school_id es requerido', 400);

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school?.active) throw new AppError('El colegio no existe o está inactivo', 404);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Este email ya está registrado', 409);

  const password_hash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: {
      email: input.email,
      password_hash,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: input.role as UserRole,
      school_id: schoolId,
    },
    select: userSelect,
  });
}

export async function listUsers(actor: JwtPayload, schoolId?: string) {
  if (actor.role === 'SUPER_ADMIN') {
    return prisma.user.findMany({
      where: schoolId ? { school_id: schoolId } : {},
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
      select: userSelect,
    });
  }
  if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
  return prisma.user.findMany({
    where: { school_id: actor.schoolId },
    orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
    select: userSelect,
  });
}

export async function getUser(id: string, actor: JwtPayload) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  assertAccess(user, actor);
  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, actor: JwtPayload) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  assertAccess(user, actor);

  // SCHOOL_ADMIN no puede reactivar ni cambiar estado de SUPER_ADMIN
  if (actor.role !== 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') {
    throw new AppError('No puedes modificar un Super Administrador', 403);
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: userSelect,
  });
}

export async function deactivateUser(id: string, actor: JwtPayload) {
  // No se puede auto-desactivar
  if (id === actor.sub) throw new AppError('No puedes desactivar tu propia cuenta', 400);
  return updateUser(id, { active: false }, actor);
}
