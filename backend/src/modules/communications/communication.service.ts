import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateCommunicationInput } from './communication.schemas.js';

export async function createCommunication(input: CreateCommunicationInput, actor: JwtPayload) {
  const sender = await prisma.user.findUnique({ where: { id: actor.sub } });
  if (!sender || !sender.school_id) {
    throw new AppError('El remitente no existe o no tiene un colegio asignado', 400);
  }

  const receiver = await prisma.user.findUnique({ where: { id: input.receiver_id } });
  if (!receiver || receiver.school_id !== sender.school_id) {
    throw new AppError('El destinatario no existe o no pertenece al mismo colegio', 400);
  }

  return prisma.communication.create({
    data: {
      school_id: sender.school_id,
      sender_id: actor.sub,
      receiver_id: input.receiver_id,
      title: input.title,
      body: input.body,
      attachment_url: input.attachment_url || null,
      is_read: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function listCommunications(
  actor: JwtPayload,
  filters?: { box?: 'inbox' | 'outbox'; page?: number; limit?: number },
) {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Scope by school
  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;
  }

  // Filter by box (inbox = received by actor, outbox = sent by actor)
  if (filters?.box === 'outbox') {
    where.sender_id = actor.sub;
  } else {
    // Default is inbox
    where.receiver_id = actor.sub;
  }

  const [communications, total] = await prisma.$transaction([
    prisma.communication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
            avatar_url: true,
          },
        },
        receiver: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    }),
    prisma.communication.count({ where }),
  ]);

  return { communications, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getCommunication(id: string, actor: JwtPayload) {
  const communication = await prisma.communication.findUnique({
    where: { id },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!communication) throw new AppError('Mensaje no encontrado', 404);

  // Authorization check: sender, receiver, or school admin of the same school
  const isSender = communication.sender_id === actor.sub;
  const isReceiver = communication.receiver_id === actor.sub;
  const isAdmin = (actor.role === 'SCHOOL_ADMIN' || actor.role === 'SUPER_ADMIN') && communication.school_id === actor.schoolId;

  if (!isSender && !isReceiver && !isAdmin) {
    throw new AppError('No tienes permiso para ver este mensaje', 403);
  }

  // If the receiver opens the message, mark it as read automatically
  if (isReceiver && !communication.is_read) {
    await prisma.communication.update({
      where: { id },
      data: { is_read: true },
    });
    communication.is_read = true;
  }

  return communication;
}

export async function deleteCommunication(id: string, actor: JwtPayload) {
  const communication = await prisma.communication.findUnique({ where: { id } });
  if (!communication) throw new AppError('Mensaje no encontrado', 404);

  const isSender = communication.sender_id === actor.sub;
  const isReceiver = communication.receiver_id === actor.sub;
  const isAdmin = (actor.role === 'SCHOOL_ADMIN' || actor.role === 'SUPER_ADMIN') && communication.school_id === actor.schoolId;

  if (!isSender && !isReceiver && !isAdmin) {
    throw new AppError('No tienes permiso para eliminar este mensaje', 403);
  }

  await prisma.communication.delete({ where: { id } });
}

export async function markAsRead(id: string, actor: JwtPayload) {
  const communication = await prisma.communication.findUnique({ where: { id } });
  if (!communication) throw new AppError('Mensaje no encontrado', 404);

  // Check if actor is the receiver
  if (communication.receiver_id !== actor.sub) {
    throw new AppError('No estás autorizado para marcar este mensaje como leído', 403);
  }

  return prisma.communication.update({
    where: { id },
    data: { is_read: true },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

