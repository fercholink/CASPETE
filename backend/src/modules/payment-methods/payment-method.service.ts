import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const pmSelect = {
  id: true, key: true, label: true, icon: true, color: true,
  fields: true, active: true, sort_order: true,
} as const;

/** Lista métodos de pago activos (para padres y público) */
export async function listActive() {
  return prisma.paymentMethod.findMany({
    where: { active: true },
    orderBy: { sort_order: 'asc' },
    select: pmSelect,
  });
}

/** Lista todos (para admin) */
export async function listAll() {
  return prisma.paymentMethod.findMany({
    orderBy: { sort_order: 'asc' },
    select: { ...pmSelect, created_at: true, updated_at: true },
  });
}

/** Obtener uno por id */
export async function getById(id: string) {
  const pm = await prisma.paymentMethod.findUnique({ where: { id }, select: { ...pmSelect, created_at: true, updated_at: true } });
  if (!pm) throw new AppError('Método de pago no encontrado', 404);
  return pm;
}

/** Crear método de pago */
export async function create(data: {
  key: string; label: string; icon: string; color: string;
  fields: { label: string; value: string }[];
  sort_order?: number;
}) {
  const exists = await prisma.paymentMethod.findUnique({ where: { key: data.key } });
  if (exists) throw new AppError(`Ya existe un método con clave "${data.key}"`, 409);
  return prisma.paymentMethod.create({ data: { ...data, fields: data.fields as any }, select: pmSelect });
}

/** Actualizar método de pago */
export async function update(id: string, data: {
  label?: string; icon?: string; color?: string;
  fields?: { label: string; value: string }[];
  active?: boolean; sort_order?: number;
}) {
  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) throw new AppError('Método de pago no encontrado', 404);

  const updateData: Record<string, unknown> = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.fields !== undefined) updateData.fields = data.fields;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

  return prisma.paymentMethod.update({ where: { id }, data: updateData, select: pmSelect });
}

/** Eliminar método de pago */
export async function remove(id: string) {
  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) throw new AppError('Método de pago no encontrado', 404);
  await prisma.paymentMethod.delete({ where: { id } });
  return { deleted: true };
}
