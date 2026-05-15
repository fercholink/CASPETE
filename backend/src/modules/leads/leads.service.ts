import { prisma } from '../../lib/prisma.js';
import type { CreateLeadInput, UpdateLeadInput } from './leads.schemas.js';

/** Recibe un lead desde la landing (público, sin auth) */
export async function createLead(input: CreateLeadInput) {
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
