import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateSupplierInput, UpdateSupplierInput } from './supplier.schemas.js';

const TECH_SHEET_MAX_AGE_DAYS = 365; // 12 meses según la sección 6.3

const supplierSelect = {
  id: true, name: true, nit: true, contact_name: true, contact_phone: true,
  contact_email: true, city: true, tech_sheet_url: true, tech_sheet_uploaded_at: true,
  is_verified: true, active: true, created_at: true, updated_at: true,
} as const;

function requireAdmin(actor: JwtPayload) {
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role)) {
    throw new AppError('No autorizado', 403);
  }
}

export async function createSupplier(input: CreateSupplierInput, actor: JwtPayload) {
  requireAdmin(actor);
  return prisma.supplier.create({
    data: {
      name:          input.name,
      nit:           input.nit           ?? null,
      contact_name:  input.contact_name  ?? null,
      contact_phone: input.contact_phone ?? null,
      contact_email: input.contact_email ?? null,
      city:          input.city          ?? null,
      tech_sheet_url:         input.tech_sheet_url         ?? null,
      tech_sheet_uploaded_at: input.tech_sheet_uploaded_at ?? null,
      is_verified:   input.is_verified   ?? false,
    },
    select: supplierSelect,
  });
}

export async function listSuppliers(actor: JwtPayload, opts: { page?: number; limit?: number; expired_only?: string } = {}) {
  requireAdmin(actor);
  const page  = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip  = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  // Alerta: fichas técnicas vencidas (>12 meses)
  if (opts.expired_only === 'true') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TECH_SHEET_MAX_AGE_DAYS);
    where.tech_sheet_uploaded_at = { lt: cutoff };
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, select: supplierSelect }),
    prisma.supplier.count({ where }),
  ]);
  return { suppliers, total, page, pages: Math.ceil(total / limit) };
}

export async function getSupplier(id: string, actor: JwtPayload) {
  requireAdmin(actor);
  const s = await prisma.supplier.findUnique({ where: { id }, select: supplierSelect });
  if (!s) throw new AppError('Proveedor no encontrado', 404);
  return s;
}

export async function updateSupplier(id: string, input: UpdateSupplierInput, actor: JwtPayload) {
  requireAdmin(actor);
  await getSupplier(id, actor);
  const data: Record<string, unknown> = {};
  if (input.name !== undefined)                   data.name = input.name;
  if (input.nit !== undefined)                    data.nit = input.nit ?? null;
  if (input.contact_name !== undefined)           data.contact_name = input.contact_name ?? null;
  if (input.contact_phone !== undefined)          data.contact_phone = input.contact_phone ?? null;
  if (input.contact_email !== undefined)          data.contact_email = input.contact_email ?? null;
  if (input.city !== undefined)                   data.city = input.city ?? null;
  if (input.is_verified !== undefined)            data.is_verified = input.is_verified;
  if (input.active !== undefined)                 data.active = input.active;
  if (input.tech_sheet_url !== undefined) {
    data.tech_sheet_url = input.tech_sheet_url ?? null;
    data.tech_sheet_uploaded_at = new Date();
  }
  return prisma.supplier.update({ where: { id }, data, select: supplierSelect });
}

export async function deleteSupplier(id: string, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo SUPER_ADMIN puede eliminar proveedores', 403);
  await getSupplier(id, actor);
  return prisma.supplier.delete({ where: { id } });
}

/** KPI: proveedores con ficha técnica vencida (>12 meses) — para dashboard Ley 2120 */
export async function getExpiredTechSheets(actor: JwtPayload) {
  requireAdmin(actor);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TECH_SHEET_MAX_AGE_DAYS);
  return prisma.supplier.findMany({
    where: { OR: [{ tech_sheet_uploaded_at: { lt: cutoff } }, { tech_sheet_url: null }], active: true },
    select: supplierSelect,
    orderBy: { tech_sheet_uploaded_at: 'asc' },
  });
}
