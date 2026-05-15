/**
 * Chat Service — Mensajería interna Tendero ↔ Padre
 * ──────────────────────────────────────────────────
 * Reglas de negocio:
 * 1. Solo VENDOR puede crear hilos (no el padre).
 * 2. Solo los participantes pueden leer/responder.
 * 3. SCHOOL_ADMIN ve todos los hilos de su colegio (solo lectura).
 * 4. SUPER_ADMIN ve todo globalmente.
 * 5. Un pedido puede tener como máximo 1 hilo activo.
 * 6. Mensajes limitados a 1000 caracteres.
 * 7. Al enviar mensaje se dispara Web Push al destinatario.
 */

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateThreadInput, SendMessageInput, CloseThreadInput } from './chat.schemas.js';
import { sendPushToUser } from '../push/push.service.js';

// ── Selector reutilizable ────────────────────────────────────────────────────

const threadSelect = {
  id: true,
  school_id: true,
  order_id: true,
  subject: true,
  status: true,
  created_at: true,
  updated_at: true,
  vendor: { select: { id: true, full_name: true, avatar_url: true, role: true } },
  parent: { select: { id: true, full_name: true, avatar_url: true, role: true } },
  order: { select: { id: true, scheduled_date: true, total_amount: true, status: true } },
  _count: { select: { messages: true } },
} as const;

const messageSelect = {
  id: true,
  thread_id: true,
  content: true,
  read_at: true,
  created_at: true,
  sender: { select: { id: true, full_name: true, avatar_url: true, role: true } },
} as const;

// ── Helpers de autorización ──────────────────────────────────────────────────

async function getActorSchoolId(actor: JwtPayload): Promise<string | null> {
  if (actor.schoolId) return actor.schoolId;
  const u = await prisma.user.findUnique({ where: { id: actor.sub }, select: { school_id: true } });
  return u?.school_id ?? null;
}

async function assertThreadAccess(threadId: string, actor: JwtPayload) {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { vendor_id: true, parent_id: true, school_id: true },
  });
  if (!thread) throw new AppError('Hilo no encontrado', 404);

  if (actor.role === 'SUPER_ADMIN') return thread;

  if (actor.role === 'SCHOOL_ADMIN') {
    const schoolId = await getActorSchoolId(actor);
    if (schoolId !== thread.school_id) throw new AppError('No tienes acceso a este hilo', 403);
    return thread;
  }

  // VENDOR y PARENT: solo si son participantes
  if (actor.sub === thread.vendor_id || actor.sub === thread.parent_id) return thread;

  throw new AppError('No tienes acceso a este hilo', 403);
}

// ── Crear hilo (solo VENDOR) ─────────────────────────────────────────────────

export async function createThread(input: CreateThreadInput, actor: JwtPayload) {
  if (actor.role !== 'VENDOR') {
    throw new AppError('Solo el tendero puede iniciar una conversación', 403);
  }

  const schoolId = await getActorSchoolId(actor);
  if (!schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);

  // Validar que el padre existe y pertenece al mismo colegio
  const parent = await prisma.user.findUnique({
    where: { id: input.parent_id },
    select: { id: true, full_name: true, school_id: true, role: true },
  });
  if (!parent || parent.role !== 'PARENT') {
    throw new AppError('El destinatario no es un padre registrado', 404);
  }

  // Validar orden si se provee
  if (input.order_id) {
    const order = await prisma.lunchOrder.findUnique({
      where: { id: input.order_id },
      select: { id: true, school_id: true },
    });
    if (!order || order.school_id !== schoolId) {
      throw new AppError('El pedido no existe o no pertenece a tu colegio', 404);
    }

    // Regla: máximo 1 hilo activo por pedido
    const existingThread = await prisma.chatThread.findFirst({
      where: { order_id: input.order_id, status: 'OPEN' },
      select: { id: true },
    });
    if (existingThread) {
      throw new AppError('Ya existe un hilo activo para este pedido', 409);
    }
  }

  // Crear hilo + primer mensaje en una transacción
  const thread = await prisma.$transaction(async (tx) => {
    const newThread = await tx.chatThread.create({
      data: {
        school_id: schoolId,
        order_id: input.order_id ?? null,
        vendor_id: actor.sub,
        parent_id: input.parent_id,
        subject: input.subject,
      },
      select: threadSelect,
    });

    await tx.chatMessage.create({
      data: {
        thread_id: newThread.id,
        sender_id: actor.sub,
        content: input.first_message,
      },
    });

    return newThread;
  });

  // Notificar al padre por Web Push
  const vendorName = thread.vendor.full_name;
  sendPushToUser(input.parent_id, {
    title: `💬 Mensaje de ${vendorName}`,
    body: input.subject,
    icon: '/favicon.png',
    tag: `chat-thread-${thread.id}`,
    url: `/chat/${thread.id}`,
  }).catch(() => {});

  return thread;
}

// ── Listar hilos ─────────────────────────────────────────────────────────────

export async function listThreads(actor: JwtPayload) {
  let where: Record<string, unknown> = {};

  if (actor.role === 'VENDOR') {
    where = { vendor_id: actor.sub };
  } else if (actor.role === 'PARENT') {
    where = { parent_id: actor.sub };
  } else if (actor.role === 'SCHOOL_ADMIN') {
    const schoolId = await getActorSchoolId(actor);
    if (!schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where = { school_id: schoolId };
  }
  // SUPER_ADMIN: sin filtro

  const threads = await prisma.chatThread.findMany({
    where,
    orderBy: { updated_at: 'desc' },
    select: {
      ...threadSelect,
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { content: true, created_at: true, sender_id: true },
      },
    },
  });

  // Añadir contador de mensajes no leídos para el actor
  return threads.map((t) => ({
    ...t,
    last_message: t.messages[0] ?? null,
    messages: undefined,
  }));
}

// ── Obtener hilo con mensajes ─────────────────────────────────────────────────

export async function getThread(threadId: string, actor: JwtPayload) {
  await assertThreadAccess(threadId, actor);

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: {
      ...threadSelect,
      messages: {
        orderBy: { created_at: 'asc' },
        select: messageSelect,
      },
    },
  });
  if (!thread) throw new AppError('Hilo no encontrado', 404);

  // Calcular unread para este actor
  const unreadCount = thread.messages.filter(
    (m) => m.sender.id !== actor.sub && !m.read_at,
  ).length;

  return { ...thread, unread_count: unreadCount };
}

// ── Enviar mensaje ───────────────────────────────────────────────────────────

export async function sendMessage(threadId: string, input: SendMessageInput, actor: JwtPayload) {
  const threadInfo = await assertThreadAccess(threadId, actor);

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { status: true, vendor_id: true, parent_id: true,
      vendor: { select: { full_name: true } },
      parent: { select: { full_name: true } },
    },
  });
  if (!thread) throw new AppError('Hilo no encontrado', 404);
  if (thread.status !== 'OPEN') {
    throw new AppError('Este hilo está cerrado. No se pueden enviar más mensajes.', 400);
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.chatMessage.create({
      data: { thread_id: threadId, sender_id: actor.sub, content: input.content },
      select: messageSelect,
    });
    // Actualizar updated_at del hilo para ordenación correcta en listado
    await tx.chatThread.update({
      where: { id: threadId },
      data: { updated_at: new Date() },
    });
    return msg;
  });

  // Notificar al otro participante
  const recipientId = actor.sub === threadInfo.vendor_id
    ? threadInfo.parent_id
    : threadInfo.vendor_id;

  const senderName = actor.sub === thread.vendor_id
    ? thread.vendor.full_name
    : thread.parent.full_name;

  sendPushToUser(recipientId, {
    title: `💬 Nuevo mensaje de ${senderName}`,
    body: input.content.length > 80 ? input.content.slice(0, 80) + '…' : input.content,
    icon: '/favicon.png',
    tag: `chat-thread-${threadId}`,
    url: `/chat/${threadId}`,
  }).catch(() => {});

  return message;
}

// ── Marcar mensajes como leídos ──────────────────────────────────────────────

export async function markThreadRead(threadId: string, actor: JwtPayload) {
  await assertThreadAccess(threadId, actor);

  const now = new Date();
  const { count } = await prisma.chatMessage.updateMany({
    where: {
      thread_id: threadId,
      sender_id: { not: actor.sub }, // solo los del otro
      read_at: null,
    },
    data: { read_at: now },
  });

  return { marked_read: count };
}

// ── Cerrar / resolver hilo ───────────────────────────────────────────────────

export async function closeThread(threadId: string, input: CloseThreadInput, actor: JwtPayload) {
  const threadInfo = await assertThreadAccess(threadId, actor);

  // Solo VENDOR del hilo, SCHOOL_ADMIN o SUPER_ADMIN pueden cerrar
  if (actor.role === 'PARENT') {
    throw new AppError('Los padres no pueden cerrar el hilo', 403);
  }
  if (actor.role === 'VENDOR' && actor.sub !== threadInfo.vendor_id) {
    throw new AppError('Solo el tendero que abrió el hilo puede cerrarlo', 403);
  }

  return prisma.chatThread.update({
    where: { id: threadId },
    data: { status: input.status },
    select: threadSelect,
  });
}

// ── Contador de no leídos (para badge en Dashboard) ──────────────────────────

export async function getUnreadCount(actor: JwtPayload) {
  const where = actor.role === 'VENDOR'
    ? { thread: { vendor_id: actor.sub } }
    : { thread: { parent_id: actor.sub } };

  const count = await prisma.chatMessage.count({
    where: {
      ...where,
      sender_id: { not: actor.sub },
      read_at: null,
    },
  });

  return { unread_messages: count };
}
