import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateOrderInput, TopupInput } from './order.schemas.js';
import type { OrderStatus } from '@prisma/client';

const OTP_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function generateOTP(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num).substring(0, 6);
}

const orderSelect = {
  id: true,
  school_id: true,
  status: true,
  scheduled_date: true,
  total_amount: true,
  delivered_at: true,
  otp_verified: true,
  notes: true,
  created_at: true,
  updated_at: true,
  school: { select: { id: true, name: true } },
  student: { select: { id: true, full_name: true, grade: true, photo_url: true, parent_id: true, balance: true, delivery_code: true } },
  store: { select: { id: true, name: true } },
  deliverer: { select: { id: true, full_name: true } },
  order_items: {
    select: {
      id: true,
      quantity: true,
      unit_price: true,
      subtotal: true,
      customizations: true,
      store_product: {
        select: {
          id: true,
          price: true,
          product: { select: { id: true, name: true, is_healthy: true, base_price: true, image_url: true } },
        },
      },
    },
  },
} as const;

type OrderRow = {
  student: { parent_id: string };
  school: { id: string };
};

function assertAccess(order: OrderRow, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if ((actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') && actor.schoolId && actor.schoolId === order.school.id) return;
  if (actor.role === 'PARENT' && actor.sub === order.student.parent_id) return;
  throw new AppError('No tienes permiso para acceder a este pedido', 403);
}

export async function createOrder(input: CreateOrderInput, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: input.student_id },
    select: { id: true, school_id: true, parent_id: true, active: true, balance: true },
  });
  if (!student?.active) throw new AppError('Estudiante no encontrado', 404);
  if (student.parent_id !== actor.sub)
    throw new AppError('No puedes crear pedidos para este estudiante', 403);

  const store = await prisma.store.findUnique({ where: { id: input.store_id } });
  if (!store?.active) throw new AppError('Tienda no encontrada o inactiva', 404);
  if (store.school_id !== student.school_id)
    throw new AppError('La tienda no pertenece al colegio del estudiante', 400);

  // Cargar los StoreProducts solicitados
  const storeProductIds = input.items.map((i) => i.store_product_id);
  const storeProducts = await prisma.storeProduct.findMany({
    where: { id: { in: storeProductIds }, active: true, store_id: input.store_id, product: { active: true } },
    select: { id: true, price: true, stock: true, product: { select: { id: true, name: true, base_price: true } } },
  });
  if (storeProducts.length !== new Set(storeProductIds).size)
    throw new AppError('Uno o más productos no están disponibles en esta tienda', 400);

  const spMap = new Map(storeProducts.map((sp) => [sp.id, sp]));
  let totalAmount = 0;
  const orderItemsData = input.items.map((item) => {
    const sp = spMap.get(item.store_product_id)!;
    if (sp.stock !== null && sp.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para "${sp.product.name}". (Quedan ${sp.stock})`, 400);
    }
    // Usar precio de la tienda si existe, si no el precio base del catálogo
    const unitPrice = sp.price ? sp.price.toNumber() : sp.product.base_price.toNumber();
    const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
    totalAmount += subtotal;
    return {
      store_product_id: item.store_product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal,
      customizations: item.customizations ?? [],
    };
  });
  totalAmount = Math.round(totalAmount * 100) / 100;

  const balance = student.balance.toNumber();
  if (balance < totalAmount) {
    throw new AppError(
      `Saldo insuficiente. Disponible: $${balance.toLocaleString('es-CO')}, Pedido: $${totalAmount.toLocaleString('es-CO')}`,
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.lunchOrder.create({
      data: {
        school_id: student.school_id,
        student_id: input.student_id,
        store_id: input.store_id,
        scheduled_date: new Date(input.scheduled_date),
        total_amount: totalAmount,
        notes: input.notes ?? null,
        order_items: { create: orderItemsData },
      },
      select: orderSelect,
    });

    // Decrementar stock de StoreProducts
    for (const item of orderItemsData) {
      const sp = spMap.get(item.store_product_id)!;
      if (sp.stock !== null) {
        await tx.storeProduct.update({
          where: { id: item.store_product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const newBalance = Math.round((balance - totalAmount) * 100) / 100;
    await tx.student.update({ where: { id: input.student_id }, data: { balance: newBalance } });
    await tx.transaction.create({
      data: {
        school_id: student.school_id,
        student_id: input.student_id,
        type: 'CHARGE',
        amount: totalAmount,
        balance_after: newBalance,
        order_id: order.id,
      },
    });

    return order;
  });
}

export async function listOrders(
  actor: JwtPayload,
  filters: { status?: string; scheduled_date?: string; search?: string; page?: number; limit?: number } = {},
) {
  const { status, scheduled_date, search, page = 1, limit = 20 } = filters;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const where: Record<string, unknown> = {};
  if (status) where.status = status as OrderStatus;
  if (scheduled_date) where.scheduled_date = new Date(scheduled_date);
  if (search) where.student = { full_name: { contains: search, mode: 'insensitive' } };

  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;
  } else if (actor.role === 'PARENT') {
    where.student = { ...(where.student as object || {}), parent_id: actor.sub };
  }
  // SUPER_ADMIN: no extra filter

  const [orders, total] = await Promise.all([
    prisma.lunchOrder.findMany({ where, orderBy: [{ scheduled_date: 'desc' }, { created_at: 'desc' }], skip, take, select: orderSelect }),
    prisma.lunchOrder.count({ where }),
  ]);

  return { orders, total, page: Math.max(page, 1), pages: Math.ceil(total / take) };
}

export async function getOrderStats(actor: JwtPayload) {
  const base: Record<string, unknown> = {};
  if (actor.role === 'SCHOOL_ADMIN' || actor.role === 'VENDOR') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    base.school_id = actor.schoolId;
  } else if (actor.role === 'PARENT') {
    base.student = { parent_id: actor.sub };
  }

  const [total, pending, confirmed, delivered, cancelled] = await Promise.all([
    prisma.lunchOrder.count({ where: base }),
    prisma.lunchOrder.count({ where: { ...base, status: 'PENDING' } }),
    prisma.lunchOrder.count({ where: { ...base, status: 'CONFIRMED' } }),
    prisma.lunchOrder.count({ where: { ...base, status: 'DELIVERED' } }),
    prisma.lunchOrder.count({ where: { ...base, status: 'CANCELLED' } }),
  ]);

  return { total, pending, confirmed, delivered, cancelled };
}

export async function bulkConfirmOrders(actor: JwtPayload, scheduledDate?: string) {
  if (actor.role === 'PARENT') {
    throw new AppError('No tienes permiso para confirmar pedidos masivamente', 403);
  }
  const schoolFilter = actor.role === 'SUPER_ADMIN' ? {} : { school_id: actor.schoolId! };
  const dateFilter = scheduledDate ? { scheduled_date: new Date(scheduledDate) } : {};

  const result = await prisma.lunchOrder.updateMany({
    where: { status: 'PENDING', ...schoolFilter, ...dateFilter },
    data: { status: 'CONFIRMED' },
  });
  return { confirmed: result.count };
}

export async function getOrder(id: string, actor: JwtPayload) {
  const order = await prisma.lunchOrder.findUnique({
    where: { id },
    select: { ...orderSelect },
  });
  if (!order) throw new AppError('Pedido no encontrado', 404);
  assertAccess(order, actor);

  let otpCode: string | null = null;
  if (actor.role === 'PARENT' && order.status === 'CONFIRMED') {
    otpCode = order.student.delivery_code ?? null;
  }

  return { ...order, otp_code: otpCode };
}

export async function confirmOrder(id: string, actor: JwtPayload) {
  const order = await prisma.lunchOrder.findUnique({ where: { id }, select: orderSelect });
  if (!order) throw new AppError('Pedido no encontrado', 404);
  assertAccess(order, actor);
  if (order.status !== 'PENDING') throw new AppError('Solo se pueden confirmar pedidos pendientes', 400);
  return prisma.lunchOrder.update({ where: { id }, data: { status: 'CONFIRMED' }, select: orderSelect });
}

export async function cancelOrder(id: string, actor: JwtPayload) {
  const order = await prisma.lunchOrder.findUnique({ where: { id }, select: orderSelect });
  if (!order) throw new AppError('Pedido no encontrado', 404);
  assertAccess(order, actor);
  if (order.status === 'DELIVERED' || order.status === 'REFUNDED' || order.status === 'CANCELLED')
    throw new AppError('Este pedido no se puede cancelar', 400);
  if (actor.role === 'PARENT' && order.status !== 'PENDING')
    throw new AppError('Solo puedes cancelar pedidos pendientes', 400);

  const refundAmount = order.total_amount.toNumber();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lunchOrder.update({
      where: { id },
      data: { status: 'CANCELLED', otp_code: null, otp_expires_at: null },
      select: orderSelect,
    });

    const student = await tx.student.findUnique({
      where: { id: order.student.id },
      select: { balance: true },
    });
    if (!student) return updated;

    const newBalance = Math.round((student.balance.toNumber() + refundAmount) * 100) / 100;
    await tx.student.update({ where: { id: order.student.id }, data: { balance: newBalance } });
    await tx.transaction.create({
      data: {
        school_id: order.school_id,
        student_id: order.student.id,
        type: 'REFUND',
        amount: refundAmount,
        balance_after: newBalance,
        order_id: id,
      },
    });

    // Restaurar stock de StoreProducts
    for (const item of order.order_items) {
      if (item.store_product) {
        const sp = await tx.storeProduct.findUnique({ where: { id: item.store_product.id }, select: { stock: true } });
        if (sp?.stock !== null) {
          await tx.storeProduct.update({
            where: { id: item.store_product.id },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    return updated;
  });
}

export async function deliverOrder(id: string, otpCode: string, actor: JwtPayload) {
  const order = await prisma.lunchOrder.findUnique({
    where: { id },
    select: { ...orderSelect },
  });
  if (!order) throw new AppError('Pedido no encontrado', 404);
  assertAccess(order, actor);
  if (order.status !== 'CONFIRMED') throw new AppError('Solo se pueden entregar pedidos confirmados', 400);
  if (!order.student.delivery_code) throw new AppError('El estudiante no tiene un código de entrega asignado.', 400);
  if (otpCode !== order.student.delivery_code) throw new AppError('Código de entrega inválido', 400);

  return prisma.lunchOrder.update({
    where: { id },
    data: { status: 'DELIVERED', otp_verified: true, delivered_at: new Date(), delivered_by: actor.sub, otp_code: null, otp_expires_at: null },
    select: orderSelect,
  });
}

export async function deliverStudentOrders(studentId: string, deliveryCode: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (!student.delivery_code) throw new AppError('El estudiante no tiene código de entrega asignado.', 400);
  if (deliveryCode !== student.delivery_code) throw new AppError('Código de entrega inválido', 400);

  const pendingDeliveries = await prisma.lunchOrder.findMany({
    where: {
      student_id: studentId,
      status: 'CONFIRMED',
      ...(actor.role === 'VENDOR' ? { store: { school_id: actor.schoolId! } } : {}),
    },
    select: { id: true }
  });

  if (pendingDeliveries.length === 0) {
    throw new AppError('El estudiante no tiene pedidos confirmados pendientes de entrega.', 400);
  }

  const orderIds = pendingDeliveries.map(o => o.id);

  const result = await prisma.lunchOrder.updateMany({
    where: { id: { in: orderIds } },
    data: {
      status: 'DELIVERED',
      otp_verified: true,
      delivered_at: new Date(),
      delivered_by: actor.sub,
      otp_code: null,
      otp_expires_at: null,
    }
  });

  const updatedOrders = await prisma.lunchOrder.findMany({
    where: { id: { in: orderIds } },
    select: orderSelect,
  });

  return { delivered: result.count, orders: updatedOrders };
}

export async function topupStudent(studentId: string, input: TopupInput, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, school_id: true, active: true, balance: true },
  });
  if (!student?.active) throw new AppError('Estudiante no encontrado', 404);
  if (actor.role === 'SCHOOL_ADMIN' && actor.schoolId !== student.school_id)
    throw new AppError('No tienes permiso para recargar este estudiante', 403);

  const newBalance = Math.round((student.balance.toNumber() + input.amount) * 100) / 100;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
      select: { id: true, full_name: true, balance: true, school: { select: { name: true } } },
    });
    await tx.transaction.create({
      data: {
        school_id: student.school_id,
        student_id: studentId,
        type: 'TOPUP',
        amount: input.amount,
        balance_after: newBalance,
      },
    });
    return updated;
  });
}

export async function deleteOrder(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede eliminar pedidos permanentemente', 403);
  }

  const order = await prisma.lunchOrder.findUnique({ where: { id }, select: { id: true } });
  if (!order) throw new AppError('Pedido no encontrado', 404);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { order_id: id } }),
    prisma.transaction.deleteMany({ where: { order_id: id } }),
    prisma.lunchOrder.delete({ where: { id } }),
  ]);
}
