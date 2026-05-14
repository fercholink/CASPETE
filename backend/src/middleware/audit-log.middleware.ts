import { prisma } from '../lib/prisma.js';
import type { Request } from 'express';

/**
 * Middleware de Auditoría — Ley 1581/2012 Art. 17 + Circular 002 SIC (Accountability)
 * Registra toda operación sobre datos personales sensibles.
 */
export async function logAudit(params: {
  req?: Request;
  userId?: string | null;
  role?: string | null;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ANONYMIZE';
  entity: string;
  recordId?: string | null;
  fields?: string[];
  justification?: string;
}) {
  try {
    const forwardedFor = params.req?.headers['x-forwarded-for'];
    const remoteAddr   = params.req?.socket?.remoteAddress;
    let ipAddress: string | null = null;
    if (typeof forwardedFor === 'string') ipAddress = (forwardedFor.split(',')[0] ?? forwardedFor).trim().substring(0, 45);
    else if (typeof remoteAddr === 'string') ipAddress = remoteAddr.substring(0, 45);

    await prisma.auditLog.create({
      data: {
        user_id: params.userId ?? null,
        role: params.role ?? null,
        action: params.action,
        entity: params.entity,
        record_id: params.recordId ?? null,
        fields: params.fields ?? [],
        ip_address: ipAddress,
        justification: params.justification ?? null,
      },
    });
  } catch {
    // No bloquear el flujo principal si falla el log
    console.error('[AuditLog] Error al registrar operación de auditoría');
  }
}
