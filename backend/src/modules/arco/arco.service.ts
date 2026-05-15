import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logAudit } from '../../middleware/audit-log.middleware.js';
import type { Request } from 'express';

const CONSENT_VERSION = 'v1.0'; // Actualizar al modificar la Política de Tratamiento

// ── ARCO: Acceso ────────────────────────────────────────────────────────────
/**
 * Retorna todos los datos personales del titular (padre/tutor y sus hijos).
 * Derecho de Acceso — Art. 8, 13 Ley 1581/2012. Plazo máximo: 10 días hábiles.
 */
export async function getMyData(userId: string, req: Request) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, full_name: true, phone: true, country_code: true,
      role: true, school_id: true, active: true, created_at: true,
      // Consentimientos
      consent_general: true, consent_sensitive: true, consent_legal_rep: true,
      consent_timestamp: true, consent_version: true,
      allow_analytics: true, allow_marketing: true,
      deletion_requested: true, anonymized: true,
      // Hijos registrados
      students: {
        select: {
          id: true, full_name: true, grade: true, national_id: true,
          active: true, created_at: true,
          allergies: {
            select: { allergy: { select: { name: true, severity: true } } },
          },
          school: { select: { name: true, city: true } },
        },
      },
    },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  await logAudit({
    req, userId, role: user.role,
    action: 'READ', entity: 'User',
    recordId: userId,
    fields: ['personal_data', 'students', 'consent_data'],
    justification: 'Ejercicio Derecho de Acceso — Art. 13 Ley 1581/2012',
  });

  return user;
}

// ── ARCO: Oposición (toggles granulares) ────────────────────────────────────
/**
 * Actualiza preferencias de oposición al tratamiento.
 * Derecho de Oposición — Art. 13 lit. c Ley 1581/2012. Efecto: inmediato.
 */
export async function updatePrivacyToggles(
  userId: string,
  toggles: { allow_analytics?: boolean; allow_marketing?: boolean },
  req: Request,
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(typeof toggles.allow_analytics === 'boolean' ? { allow_analytics: toggles.allow_analytics } : {}),
      ...(typeof toggles.allow_marketing === 'boolean' ? { allow_marketing: toggles.allow_marketing } : {}),
    },
    select: { allow_analytics: true, allow_marketing: true },
  });

  await logAudit({
    req, userId,
    action: 'UPDATE', entity: 'User',
    recordId: userId,
    fields: Object.keys(toggles),
    justification: 'Ejercicio Derecho de Oposición — Art. 13 Ley 1581/2012',
  });

  return updated;
}

// ── ARCO: Cancelación / Derecho al Olvido ───────────────────────────────────
/**
 * Inicia el periodo de gracia de 30 días para eliminación de datos.
 * Derecho de Supresión — Art. 8 lit. c, Art. 15 Ley 1581/2012.
 */
export async function requestDeletion(userId: string, reason: string, req: Request) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletion_requested: true, role: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (user.deletion_requested) throw new AppError('Ya existe una solicitud de eliminación activa', 409);

  await prisma.user.update({
    where: { id: userId },
    data: { deletion_requested: true, deletion_requested_at: new Date() },
  });

  // Registrar como solicitud ARCO formal
  await prisma.arcoRequest.create({
    data: { user_id: userId, type: 'DELETE', description: reason },
  });

  await logAudit({
    req, userId, role: user.role,
    action: 'DELETE', entity: 'User',
    recordId: userId,
    fields: ['deletion_requested'],
    justification: `Ejercicio Derecho al Olvido — Art. 15 Ley 1581/2012. Razón: ${reason}`,
  });

  return {
    message: 'Solicitud de eliminación registrada. Sus datos serán anonimizados en 30 días.',
    scheduled_for: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Cancela una solicitud de eliminación pendiente (dentro del periodo de gracia).
 */
export async function cancelDeletionRequest(userId: string, req: Request) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletion_requested: true, role: true },
  });
  if (!user?.deletion_requested) throw new AppError('No existe solicitud de eliminación pendiente', 404);

  await prisma.user.update({
    where: { id: userId },
    data: { deletion_requested: false, deletion_requested_at: null },
  });

  await logAudit({
    req, userId, role: user.role,
    action: 'UPDATE', entity: 'User',
    recordId: userId,
    fields: ['deletion_requested'],
    justification: 'Cancelación de solicitud de eliminación por el titular',
  });

  return { message: 'Solicitud de eliminación cancelada exitosamente.' };
}

/**
 * Anonimiza efectivamente el usuario (ejecutado por cron 30 días después de la solicitud).
 * SOLO para uso interno del sistema.
 */
export async function anonymizeUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    // Anonimizar datos del usuario
    await tx.user.update({
      where: { id: userId },
      data: {
        full_name: '[ELIMINADO]',
        email: `deleted_${userId}@anonimizado.caspete`,
        phone: null,
        password_hash: null,
        google_id: null,
        active: false,
        anonymized: true,
        deletion_executed_at: new Date(),
      },
    });

    // Anonimizar datos de los menores vinculados
    await tx.student.updateMany({
      where: { parent_id: userId },
      data: { full_name: '[ELIMINADO]', national_id: null, active: false },
    });

    // Eliminar alergias de los menores (datos sensibles)
    const students = await tx.student.findMany({ where: { parent_id: userId }, select: { id: true } });
    for (const s of students) {
      await tx.studentAllergy.deleteMany({ where: { student_id: s.id } });
    }

    // Revocar tokens de sesión
    await tx.refreshToken.deleteMany({ where: { user_id: userId } });
  });

  await logAudit({
    userId: null, role: 'SYSTEM',
    action: 'ANONYMIZE', entity: 'User',
    recordId: userId,
    fields: ['full_name', 'email', 'phone', 'password_hash', 'students', 'allergies'],
    justification: 'Anonimización automática — 30 días después de solicitud. Art. 15 Ley 1581/2012',
  });
}

// ── Actualizar consentimientos ───────────────────────────────────────────────
/**
 * Registra los consentimientos otorgados durante el registro.
 * Llamado desde auth.service al registrar un nuevo usuario.
 */
export async function saveConsents(
  userId: string,
  consents: { general: boolean; sensitive: boolean; legalRep: boolean },
  ip: string,
) {
  if (!consents.general || !consents.sensitive || !consents.legalRep) {
    throw new AppError('Los tres consentimientos son obligatorios para el registro', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      consent_general: true,
      consent_sensitive: true,
      consent_legal_rep: true,
      consent_timestamp: new Date(),
      consent_version: CONSENT_VERSION,
      consent_ip: ip.substring(0, 45),
    },
  });

  await logAudit({
    userId, role: 'PARENT',
    action: 'CREATE', entity: 'User',
    recordId: userId,
    fields: ['consent_general', 'consent_sensitive', 'consent_legal_rep', 'consent_version', 'consent_ip'],
    justification: `Consentimientos otorgados en registro — Política ${CONSENT_VERSION}. Art. 9 Ley 1581/2012`,
  });
}

// ── Consentimiento de Cookies (público, anónimos y autenticados) ─────────────
/**
 * Registra la decisión del usuario ante el banner de cookies.
 * Aplica a usuarios anónimos (visitantes) y autenticados.
 * Fuente de trazabilidad requerida por el Art. 7 y 12 Ley 1581/2012.
 *
 * Si el usuario está autenticado (userId presente), actualiza además
 * allow_analytics y allow_marketing en su perfil.
 */
export async function saveCookieConsent(
  prefs: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    version: string;
    userId?: string;
  },
  req: Request,
) {
  const userAgent = (req.headers['user-agent'] ?? 'unknown').substring(0, 200);
  const justification =
    `Cookie consent — necesarias:${prefs.necessary} analytics:${prefs.analytics} ` +
    `marketing:${prefs.marketing} versión:${prefs.version} ` +
    `ua:${userAgent}`;

  // Si el usuario está autenticado, sincronizar preferencias en BD
  if (prefs.userId) {
    const user = await prisma.user.findUnique({
      where: { id: prefs.userId },
      select: { role: true },
    });

    if (user) {
      await prisma.user.update({
        where: { id: prefs.userId },
        data: {
          allow_analytics: prefs.analytics,
          allow_marketing: prefs.marketing,
        },
      });

      await logAudit({
        req, userId: prefs.userId, role: user.role,
        action: 'UPDATE', entity: 'User',
        recordId: prefs.userId,
        fields: ['allow_analytics', 'allow_marketing', 'cookie_consent'],
        justification,
      });

      return { recorded: true, authenticated: true };
    }
  }

  // Usuario anónimo: solo auditlog sin usuario
  await logAudit({
    req, userId: null, role: 'ANONYMOUS',
    action: 'CREATE', entity: 'CookieConsent',
    recordId: null,
    fields: ['necessary', 'analytics', 'marketing'],
    justification,
  });

  return { recorded: true, authenticated: false };
}

// ── Panel Compliance — SUPER_ADMIN ───────────────────────────────────────────

/**
 * Lista entradas del AuditLog con filtros y paginación.
 * Solo SUPER_ADMIN.
 */
export async function getAuditLogs(filters: {
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  userId?: string;
}) {
  const { page, limit, action, entity, userId } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(action ? { action: action as 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ANONYMIZE' } : {}),
    ...(entity ? { entity: { contains: entity, mode: 'insensitive' as const } } : {}),
    ...(userId ? { user_id: userId } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { full_name: true, email: true, role: true } },
      },
    }),
  ]);

  return {
    data: logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Lista todas las solicitudes ARCO pendientes/completadas.
 * Solo SUPER_ADMIN.
 */
export async function getArcoRequests() {
  return prisma.arcoRequest.findMany({
    orderBy: { created_at: 'desc' },
  });
}

// ── Reporte SIC (Superintendencia de Industria y Comercio) ───────────────────

/**
 * Genera un reporte consolidado de cumplimiento para la SIC.
 * Ley 1581/2012 — Art. 17 lit. f (Informar a la SIC sobre brechas)
 * Decreto 1377/2013 — Art. 13 (Responsabilidad demostrada)
 *
 * Incluye:
 * - Estadísticas generales de consentimientos
 * - Resumen de solicitudes ARCO (totales, resueltas, pendientes)
 * - Brechas de seguridad registradas
 * - Entradas del AuditLog por categoría (últimos 90 días)
 */
export async function generateSicReport() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    consentStats,
    arcoStats,
    auditStats,
    breachLogs,
    recentAuditSample,
  ] = await Promise.all([
    // Estadísticas de consentimientos
    prisma.user.aggregate({
      _count: {
        id: true,
        consent_general: true,
      },
      where: { anonymized: false },
    }),

    // Estadísticas ARCO
    prisma.arcoRequest.groupBy({
      by: ['status', 'type'],
      _count: { id: true },
    }),

    // Resumen AuditLog últimos 90 días por acción
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: { created_at: { gte: ninetyDaysAgo } },
    }),

    // Brechas de seguridad
    prisma.auditLog.findMany({
      where: { entity: 'SecurityBreach' },
      orderBy: { created_at: 'desc' },
      select: { id: true, created_at: true, justification: true },
    }),

    // Muestra de las últimas 10 entradas del AuditLog (para referencia)
    prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true, action: true, entity: true,
        role: true, created_at: true, justification: true,
      },
    }),
  ]);

  // Calcular consentidos (usuarios con los 3 consentimientos)
  const totalUsers = await prisma.user.count({ where: { anonymized: false } });
  const totalConsented = await prisma.user.count({
    where: { anonymized: false, consent_general: true, consent_sensitive: true, consent_legal_rep: true },
  });
  const totalDeletionPending = await prisma.user.count({
    where: { deletion_requested: true, anonymized: false },
  });
  const totalAnonymized = await prisma.user.count({ where: { anonymized: true } });

  // Agrupar ARCO por tipo
  const arcoByType: Record<string, { total: number; pending: number; resolved: number }> = {};
  for (const row of arcoStats) {
    const t = row.type;
    if (!arcoByType[t]) arcoByType[t] = { total: 0, pending: 0, resolved: 0 };
    arcoByType[t].total += row._count.id;
    if (row.status === 'PENDING' || row.status === 'IN_PROGRESS') arcoByType[t].pending += row._count.id;
    if (row.status === 'RESOLVED') arcoByType[t].resolved += row._count.id;
  }

  const totalArco = arcoStats.reduce((s, r) => s + r._count.id, 0);
  const pendingArco = arcoStats.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS')
    .reduce((s, r) => s + r._count.id, 0);

  // Parsear brechas
  const breaches = breachLogs.map(e => {
    try {
      return { id: e.id, logged_at: e.created_at, ...JSON.parse(e.justification ?? '{}') };
    } catch {
      return { id: e.id, logged_at: e.created_at, raw: e.justification };
    }
  });

  return {
    generated_at: now.toISOString(),
    report_period: {
      from: ninetyDaysAgo.toISOString(),
      to: now.toISOString(),
    },
    responsible_entity: {
      name: 'Caspete.com',
      legal_framework: 'Ley 1581/2012 · Decreto 1377/2013',
      contact_email: 'privacidad@caspete.com',
    },
    consent_summary: {
      total_active_users: totalUsers,
      total_consented: totalConsented,
      consent_rate_pct: totalUsers > 0 ? Math.round((totalConsented / totalUsers) * 100) : 0,
      pending_deletion: totalDeletionPending,
      total_anonymized: totalAnonymized,
    },
    arco_summary: {
      total_requests: totalArco,
      pending_requests: pendingArco,
      by_type: arcoByType,
    },
    audit_summary_90d: auditStats.reduce<Record<string, number>>((acc, r) => {
      acc[r.action] = r._count.id;
      return acc;
    }, {}),
    security_breaches: {
      total: breaches.length,
      entries: breaches,
    },
    recent_audit_sample: recentAuditSample,
  };
}
