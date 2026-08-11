import { randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { GPS_DEVICE_PRICE } from '../gps-payments/gps-payment.service.js';
import type { CreateGpsDeviceOrderInput, UpdateGpsDeviceOrderInput } from './gps-device-order.schemas.js';

const MIN_FILL_TIME_MS = 2500; // un humano no llena un formulario + sube un comprobante en menos de esto

/**
 * Crea el pedido de compra (público, sin auth — el padre paga ANTES de
 * registrarse en Kidway). Devuelve null si se detecta spam — el llamador
 * responde éxito igual, sin crear el registro.
 */
export async function createOrder(input: CreateGpsDeviceOrderInput, ipAddress: string | null) {
  if (input.website) return null;
  if (input.form_loaded_at !== undefined && Date.now() - input.form_loaded_at < MIN_FILL_TIME_MS) {
    return null;
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDuplicate = await prisma.gpsDeviceOrder.findFirst({
    where: { contact_email: input.contact_email, created_at: { gte: dayAgo } },
    select: { id: true },
  });
  if (recentDuplicate) return null;

  return prisma.gpsDeviceOrder.create({
    data: {
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      city: input.city,
      address: input.address,
      receipt_url: input.receipt_url,
      amount: GPS_DEVICE_PRICE,
      ...(input.student_name !== undefined && { student_name: input.student_name }),
      ...(input.payment_reference !== undefined && { payment_reference: input.payment_reference }),
      ip_address: ipAddress,
    },
  });
}

/** Lista todos los pedidos — solo SUPER_ADMIN */
export async function listOrders(filters: { status?: string; page?: number; limit?: number } = {}) {
  const { status, page = 1, limit = 50 } = filters;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  const where = status !== undefined ? { status: status as never } : {};

  const [orders, total] = await Promise.all([
    prisma.gpsDeviceOrder.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.gpsDeviceOrder.count({ where }),
  ]);

  return { orders, total, page: Math.max(page, 1), pages: Math.ceil(total / take) };
}

/**
 * Actualiza un pedido — SUPER_ADMIN. Al pasar a SHIPPED (con IMEI real
 * asignado), pre-aprovisiona un GPSTracker "huérfano" (sin student_id)
 * marcado como comprado. Cuando el padre se registre y vincule ese mismo
 * IMEI desde la app, gps.service.ts:linkTracker() reutiliza esta fila
 * (busca por IMEI, y si no tiene student_id la reengancha) sin tocar
 * device_purchased — así el pago ya hecho no se pierde.
 */
export async function updateOrder(id: string, input: UpdateGpsDeviceOrderInput) {
  const existing = await prisma.gpsDeviceOrder.findUnique({ where: { id } });
  if (!existing) throw new AppError('Pedido no encontrado', 404);

  if (input.status === 'SHIPPED') {
    const imei = input.imei ?? existing.imei;
    if (!imei) throw new AppError('Debes indicar el IMEI del dispositivo que se va a enviar', 400);

    const existingTracker = await prisma.gPSTracker.findUnique({ where: { imei } });
    if (existingTracker?.student_id) {
      throw new AppError('Este IMEI ya está vinculado a un estudiante existente', 409);
    }

    const tracker = existingTracker
      ? await prisma.gPSTracker.update({ where: { id: existingTracker.id }, data: { device_purchased: true } })
      : await prisma.gPSTracker.create({
          data: {
            imei,
            qr_token: randomBytes(24).toString('hex'),
            device_purchased: true,
          },
        });

    return prisma.gpsDeviceOrder.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        imei,
        tracker_id: tracker.id,
        ...(input.tracking_number !== undefined && { tracking_number: input.tracking_number }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
  }

  return prisma.gpsDeviceOrder.update({
    where: { id },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.imei !== undefined && { imei: input.imei }),
      ...(input.tracking_number !== undefined && { tracking_number: input.tracking_number }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });
}

/** Elimina un pedido — SUPER_ADMIN (pruebas, duplicados, spam) */
export async function deleteOrder(id: string) {
  const existing = await prisma.gpsDeviceOrder.findUnique({ where: { id } });
  if (!existing) throw new AppError('Pedido no encontrado', 404);
  await prisma.gpsDeviceOrder.delete({ where: { id } });
}
