import { randomBytes, createHash } from 'crypto';
import { AppError } from '../../middleware/error.middleware.js';
import { prisma } from '../../lib/prisma.js';
import { sendDemoInvitationEmail } from '../../lib/email.js';
import { env } from '../../config/env.js';
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

const DEMO_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

/**
 * Activa la demo para un lead:
 * 1. Genera un token aleatorio y lo guarda hasheado en la BD
 * 2. Cambia el status del lead a DEMO
 * 3. Envía un correo al rector con el enlace de configuración
 *
 * Idempotente: si el lead ya tiene demo activa y no expiró, re-envía el correo.
 */
export async function activateDemoForLead(id: string) {
  const lead = await prisma.schoolLead.findUnique({ where: { id } });
  if (!lead) throw new AppError('Lead no encontrado', 404);
  if (lead.status === 'CLOSED') throw new AppError('No se puede activar demo para un lead cerrado', 400);

  // Generar token raw (lo que va en el correo) y su hash (lo que se guarda en BD)
  const rawToken = randomBytes(40).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const tokenExpires = new Date(Date.now() + DEMO_TOKEN_TTL_MS);

  const updated = await prisma.schoolLead.update({
    where: { id },
    data: {
      status: 'DEMO',
      demo_token: tokenHash,
      demo_token_expires: tokenExpires,
      demo_activated_at: new Date(),
    },
  });

  const baseUrl = (env.FRONTEND_URL.split(',')[0] ?? 'https://kidway.co').trim();
  const demoUrl = `${baseUrl}/demo-setup?token=${rawToken}`;

  await sendDemoInvitationEmail(
    lead.contact_email,
    lead.contact_name,
    lead.school_name,
    demoUrl,
  );

  return updated;
}

/**
 * Verifica un token de demo y retorna la info del lead (sin datos sensibles).
 * Usado por la página pública /demo-setup antes de mostrar el formulario.
 */
export async function verifyDemoToken(rawToken: string) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const lead = await prisma.schoolLead.findFirst({
    where: {
      demo_token: tokenHash,
      demo_token_expires: { gt: new Date() },
    },
    select: {
      id: true,
      school_name: true,
      city: true,
      contact_name: true,
      contact_email: true,
      demo_school_id: true,
    },
  });

  if (!lead) {
    throw new AppError('El enlace de invitación es inválido o ya expiró', 400);
  }

  return lead;
}
