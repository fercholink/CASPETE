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
  auth_provider: true,
  avatar_url: true,
  active: true,
  created_at: true,
  updated_at: true,
  school: { select: { id: true, name: true, city: true } },
  _count: { select: { students: true, deliveries: true } },
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

export async function listUsers(
  actor: JwtPayload,
  filters?: { search?: string; role?: string; active?: string; school_id?: string; page?: number; limit?: number },
) {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Scope by school for non-super admins
  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;
  } else if (filters?.school_id) {
    where.school_id = filters.school_id;
  }

  if (filters?.search) {
    where.OR = [
      { full_name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.role) where.role = filters.role;
  if (filters?.active !== undefined) where.active = filters.active === 'true';

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
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

  if (actor.role !== 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') {
    throw new AppError('No puedes modificar un Super Administrador', 403);
  }

  // Solo SUPER_ADMIN puede cambiar roles
  if (input.role !== undefined && actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede cambiar roles', 403);
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.role !== undefined && { role: input.role as UserRole }),
      ...(input.school_id !== undefined && actor.role === 'SUPER_ADMIN' && { school_id: input.school_id || null }),
    },
    select: userSelect,
  });
}

export async function deactivateUser(id: string, actor: JwtPayload) {
  if (id === actor.sub) throw new AppError('No puedes desactivar tu propia cuenta', 400);
  return updateUser(id, { active: false }, actor);
}

export async function deleteUser(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo el Super Administrador puede eliminar usuarios', 403);
  if (id === actor.sub) throw new AppError('No puedes eliminar tu propia cuenta', 400);

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, full_name: true } });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (user.role === 'SUPER_ADMIN') throw new AppError('No se puede eliminar otro Super Administrador', 403);

  const studentCount = await prisma.student.count({ where: { parent_id: id } });
  if (studentCount > 0) {
    throw new AppError(
      `No se puede eliminar a "${user.full_name}" porque tiene ${studentCount} estudiante(s) vinculado(s). Primero reasigna o elimina los estudiantes.`,
      409,
    );
  }

  const deliveryCount = await prisma.lunchOrder.count({ where: { delivered_by: id } });
  if (deliveryCount > 0) {
    await prisma.lunchOrder.updateMany({ where: { delivered_by: id }, data: { delivered_by: null } });
  }

  await prisma.$transaction([
    prisma.topupRequest.deleteMany({ where: { parent_id: id } }),
    prisma.refreshToken.deleteMany({ where: { user_id: id } }),
    prisma.passwordResetToken.deleteMany({ where: { user_id: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
}
