import { AppError } from '../../middleware/error.middleware.js';
import { prisma } from '../../lib/prisma.js';
import type { CreateLeadInput, AdminCreateLeadInput, UpdateLeadInput } from './leads.schemas.js';

const MIN_FILL_TIME_MS = 2500; // un humano no llena 6+ campos en menos de esto

/**
 * Recibe un lead desde la landing (público, sin auth).
 * Devuelve null si se detecta spam (honeypot, envío demasiado rápido, o
 * duplicado reciente) — el llamador responde éxito igual, sin crear el
 * registro, para no darle señal útil a un bot que esté iterando.
 */
export async function createLead(input: CreateLeadInput, ipAddress: string | null) {
  // 1. Honeypot: campo oculto que solo un bot llenaría
  if (input.website) return null;

  // 2. Envío demasiado rápido tras cargar el formulario
  if (input.form_loaded_at !== undefined && Date.now() - input.form_loaded_at < MIN_FILL_TIME_MS) {
    return null;
  }

  // 3. Duplicado: mismo correo en las últimas 24h — evita reenvíos repetidos de spam
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDuplicate = await prisma.schoolLead.findFirst({
    where: { contact_email: input.contact_email, created_at: { gte: dayAgo } },
    select: { id: true },
  });
  if (recentDuplicate) return null;

  return prisma.schoolLead.create({
    data: {
      school_name:    input.school_name,
      city:           input.city,
      contact_name:   input.contact_name,
      contact_email:  input.contact_email,
      plan_interest:  input.plan_interest,
      ...(input.nit            !== undefined && { nit:            input.nit }),
      ...(input.contact_phone  !== undefined && { contact_phone:  input.contact_phone }),
      ...(input.students_count !== undefined && { students_count: input.students_count }),
      ...(input.message        !== undefined && { message:        input.message }),
      ip_address: ipAddress,
    },
  });
}

/** Registra un lead manualmente — SUPER_ADMIN (ej. contacto hecho por llamada/WhatsApp) */
export async function createLeadAdmin(input: AdminCreateLeadInput) {
  return prisma.schoolLead.create({
    data: {
      school_name:    input.school_name,
      city:           input.city,
      contact_name:   input.contact_name,
      contact_email:  input.contact_email,
      plan_interest:  input.plan_interest,
      status:         input.status ?? 'NEW',
      ...(input.nit            !== undefined && { nit:            input.nit }),
      ...(input.contact_phone  !== undefined && { contact_phone:  input.contact_phone }),
      ...(input.students_count !== undefined && { students_count: input.students_count }),
      ...(input.message        !== undefined && { message:        input.message }),
      ...(input.created_at     !== undefined && { created_at:     input.created_at }),
    },
  });
}

/** Lista todos los leads — solo SUPER_ADMIN */
export async function listLeads(filters: { status?: string; page?: number; limit?: number } = {}) {
  const { status, page = 1, limit = 50 } = filters;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  const where = status !== undefined ? { status } : {};

  const [leads, total] = await Promise.all([
    prisma.schoolLead.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.schoolLead.count({ where }),
  ]);

  return { leads, total, page: Math.max(page, 1), pages: Math.ceil(total / take) };
}

/** Actualiza el estado/notas de un lead */
export async function updateLead(id: string, input: UpdateLeadInput) {
  return prisma.schoolLead.update({
    where: { id },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes  !== undefined && { notes:  input.notes }),
    },
  });
}

/** Elimina un lead — SUPER_ADMIN (ej. registros de prueba, duplicados o spam) */
export async function deleteLead(id: string) {
  const existing = await prisma.schoolLead.findUnique({ where: { id } });
  if (!existing) throw new AppError('Lead no encontrado', 404);
  await prisma.schoolLead.delete({ where: { id } });
}
