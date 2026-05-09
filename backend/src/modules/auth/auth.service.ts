import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { UserRole } from '@prisma/client';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: hashToken(raw),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return raw;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('Este email ya está registrado', 409);
  }

  if (input.school_id !== undefined) {
    const school = await prisma.school.findUnique({ where: { id: input.school_id } });
    if (!school || !school.active) {
      throw new AppError('El colegio indicado no existe o está inactivo', 404);
    }
  }

  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password_hash,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: input.role as UserRole,
      school_id: input.school_id ?? null,
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      school_id: true,
      created_at: true,
    },
  });

  const token = signToken(user);
  const refresh_token = await issueRefreshToken(user.id);
  return { user, token, refresh_token };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      school_id: true,
      password_hash: true,
      active: true,
      created_at: true,
    },
  });

  if (!user || !user.active) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const { password_hash: _hash, ...userWithoutPassword } = user;
  const token = signToken(userWithoutPassword);
  const refresh_token = await issueRefreshToken(user.id);
  return { user: userWithoutPassword, token, refresh_token };
}

export async function refreshTokens(rawRefreshToken: string) {
  const stored = await prisma.refreshToken.findFirst({
    where: {
      token_hash: hashToken(rawRefreshToken),
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, email: true, role: true, school_id: true, active: true },
      },
    },
  });

  if (!stored || !stored.user.active) {
    throw new AppError('Token de refresco inválido o expirado', 401);
  }

  // Rotación: revocar el token actual y emitir uno nuevo
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked_at: new Date() },
  });

  const token = signToken(stored.user);
  const refresh_token = await issueRefreshToken(stored.user.id);
  return { token, refresh_token };
}

export async function logout(rawRefreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token_hash: hashToken(rawRefreshToken), revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      school_id: true,
      avatar_url: true,
      active: true,
      created_at: true,
      school: {
        select: { id: true, name: true, city: true },
      },
    },
  });

  if (!user || !user.active) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return user;
}

export async function updateProfile(userId: string, input: import('./auth.schemas.js').UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name }),
      ...(input.phone !== undefined && { phone: input.phone }),
    },
    select: {
      id: true, email: true, full_name: true, phone: true,
      role: true, school_id: true, active: true, created_at: true,
      school: { select: { id: true, name: true, city: true } },
    },
  });
}

export async function changePassword(userId: string, input: import('./auth.schemas.js').ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password_hash: true } });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  const valid = await bcrypt.compare(input.current_password, user.password_hash);
  if (!valid) throw new AppError('La contraseña actual es incorrecta', 400);
  const password_hash = await bcrypt.hash(input.new_password, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password_hash } });
  // Revocar todos los refresh tokens al cambiar contraseña
  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

function signToken(user: {
  id: string;
  email: string;
  role: UserRole;
  school_id: string | null;
}) {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id,
  };
  const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] & string;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function forgotPassword(email: string) {
  // Buscar usuario — siempre respondemos igual por seguridad (evita user enumeration)
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, full_name: true, email: true, active: true } });
  if (!user || !user.active) return; // silencioso

  // Invalidar tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() },
  });

  // Generar token aleatorio y guardarlo hasheado
  const raw = randomBytes(40).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: createHash('sha256').update(raw).digest('hex'),
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const firstName = user.full_name.split(' ')[0] ?? user.full_name;
  const baseUrl = (env.FRONTEND_URL.split(',')[0] ?? 'https://caspete.com').trim();
  const resetUrl = `${baseUrl}/reset-password?token=${raw}`;
  await sendPasswordResetEmail(user.email, firstName, resetUrl);
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: { gt: new Date() },
    },
    include: { user: { select: { id: true, active: true } } },
  });

  if (!record || !record.user.active) {
    throw new AppError('El enlace de restablecimiento es inválido o ya expiró', 400);
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: record.user.id }, data: { password_hash } });

  // Marcar token como usado y revocar todos los refresh tokens
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used_at: new Date() } });
  await prisma.refreshToken.updateMany({
    where: { user_id: record.user.id, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}
