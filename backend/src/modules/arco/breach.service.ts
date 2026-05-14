import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middleware/audit-log.middleware.js';
import type { Request } from 'express';

/**
 * Módulo de Notificación de Brechas de Seguridad
 * Ley 1581/2012 Art. 17 lit. f — Informar a la SIC en ≤15 días hábiles
 * Decreto 1377/2013 Art. 13
 */

export interface BreachRecord {
  id: string;
  detected_at: string;
  reported_by: string;
  description: string;
  affected_data: string[];
  estimated_affected_users: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'INVESTIGATING' | 'CONTAINED' | 'REPORTED_SIC' | 'CLOSED';
  sic_notification_deadline: string;
  sic_notified_at: string | null;
  remediation_actions: string;
  created_at: string;
  updated_at: string;
}

// Almacenamiento en AuditLog (sin tabla dedicada para evitar migraciones en producción)
// Cada brecha es un registro en AuditLog con entity='SecurityBreach'

/**
 * Registra una nueva brecha de seguridad.
 * Calcula el plazo de 15 días hábiles para notificar a la SIC.
 */
export async function reportBreach(params: {
  reportedBy: string;
  description: string;
  affectedData: string[];
  estimatedAffectedUsers: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remediationActions: string;
}, req: Request) {
  const detectedAt = new Date();
  // 15 días hábiles ≈ 21 días calendario (aproximación conservadora)
  const sicDeadline = new Date(detectedAt.getTime() + 21 * 24 * 60 * 60 * 1000);

  const breachData = {
    detected_at: detectedAt.toISOString(),
    reported_by: params.reportedBy,
    description: params.description,
    affected_data: params.affectedData.join(' | '),
    estimated_affected_users: params.estimatedAffectedUsers,
    severity: params.severity,
    status: 'DETECTED',
    sic_notification_deadline: sicDeadline.toISOString(),
    remediation_actions: params.remediationActions,
  };

  await logAudit({
    req,
    userId: null,
    role: 'SUPER_ADMIN',
    action: 'CREATE',
    entity: 'SecurityBreach',
    recordId: null,
    fields: params.affectedData,
    justification: JSON.stringify(breachData),
  });

  return {
    message: 'Brecha registrada correctamente',
    sic_notification_deadline: sicDeadline.toISOString(),
    days_remaining: 21,
    severity: params.severity,
  };
}

/**
 * Lista todas las brechas registradas (recuperadas del AuditLog).
 */
export async function listBreaches() {
  const entries = await prisma.auditLog.findMany({
    where: { entity: 'SecurityBreach' },
    orderBy: { created_at: 'desc' },
  });

  return entries.map(e => {
    try {
      const data = JSON.parse(e.justification ?? '{}') as Record<string, unknown>;
      const deadline = new Date(data.sic_notification_deadline as string);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: e.id,
        ...data,
        days_until_sic_deadline: daysLeft,
        overdue: daysLeft < 0 && data.status !== 'REPORTED_SIC' && data.status !== 'CLOSED',
        logged_at: e.created_at,
      };
    } catch {
      return { id: e.id, raw: e.justification, logged_at: e.created_at };
    }
  });
}

/**
 * Verifica solicitudes ARCO que llevan más de 10 días hábiles sin resolver.
 * Plazo legal: Art. 13 Ley 1581/2012 — máximo 10 días hábiles.
 * 10 días hábiles ≈ 14 días calendario.
 */
export async function checkArcoDeadlines() {
  const BUSINESS_DAYS_LIMIT = 14; // 10 hábiles ≈ 14 calendario
  const cutoffDate = new Date(Date.now() - BUSINESS_DAYS_LIMIT * 24 * 60 * 60 * 1000);

  const overdueRequests = await prisma.arcoRequest.findMany({
    where: {
      status: 'PENDING',
      created_at: { lte: cutoffDate },
    },
    orderBy: { created_at: 'asc' },
  });

  const allPending = await prisma.arcoRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
  });

  return {
    overdue: overdueRequests.map(r => ({
      ...r,
      days_elapsed: Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      legal_deadline_passed: true,
    })),
    pending_total: allPending.length,
    overdue_count: overdueRequests.length,
    legal_limit_days: BUSINESS_DAYS_LIMIT,
  };
}
