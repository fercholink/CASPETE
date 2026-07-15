import { randomBytes } from 'crypto';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logAudit } from '../../middleware/audit-log.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { LinkTrackerInput } from './gps.schemas.js';

// qr_token solo se expone al dueño (padre) o SUPER_ADMIN vía estos endpoints —
// necesario para poder mostrar/imprimir el QR físico de la tarjeta.
const trackerSelect = {
  id: true,
  qr_token: true,
  device_name: true,
  battery_level: true,
  signal_strength: true,
  online: true,
  last_seen_at: true,
  extended_tracking_until: true,
  active: true,
} as const;

async function assertParentOwnsStudent(studentId: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parent_id: true, school_id: true },
  });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (actor.role === 'SUPER_ADMIN') return student;
  if (actor.role === 'PARENT' && student.parent_id === actor.sub) return student;
  throw new AppError('No tienes permiso para acceder a este estudiante', 403);
}

export async function linkTracker(input: LinkTrackerInput, actor: JwtPayload) {
  await assertParentOwnsStudent(input.student_id, actor);

  const existingForStudent = await prisma.gPSTracker.findUnique({
    where: { student_id: input.student_id },
  });
  if (existingForStudent) throw new AppError('Este estudiante ya tiene un localizador vinculado', 409);

  const existingImei = await prisma.gPSTracker.findUnique({ where: { imei: input.imei } });
  if (existingImei) throw new AppError('Este IMEI ya está registrado en otra tarjeta', 409);

  const qr_token = randomBytes(24).toString('hex');

  return prisma.gPSTracker.create({
    data: {
      imei: input.imei,
      qr_token,
      student_id: input.student_id,
      device_name: input.device_name ?? null,
    },
    select: trackerSelect,
  });
}

export async function unlinkTracker(id: string, actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id },
    select: { id: true, student: { select: { parent_id: true } } },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para desvincular este localizador', 403);
  }
  await prisma.gPSTracker.update({ where: { id }, data: { student_id: null } });
}

export async function getCurrentLocation(studentId: string, actor: JwtPayload, req: Request) {
  await assertParentOwnsStudent(studentId, actor);

  if (actor.role === 'SUPER_ADMIN') {
    await logAudit({
      req, userId: actor.sub, role: actor.role,
      action: 'READ', entity: 'GPSTracker', recordId: studentId,
      justification: 'Consulta de soporte técnico — ubicación GPS',
    });
  }

  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: {
      ...trackerSelect,
      telemetry: { orderBy: { recorded_at: 'desc' }, take: 1 },
    },
  });
  if (!tracker) throw new AppError('Este estudiante no tiene un localizador vinculado', 404);

  const { telemetry, ...trackerInfo } = tracker;
  return { tracker: trackerInfo, location: telemetry[0] ?? null };
}

export async function getHistory(studentId: string, hours: number, actor: JwtPayload, req: Request) {
  await assertParentOwnsStudent(studentId, actor);

  if (actor.role === 'SUPER_ADMIN') {
    await logAudit({
      req, userId: actor.sub, role: actor.role,
      action: 'READ', entity: 'GPSTelemetry', recordId: studentId,
      justification: 'Consulta de soporte técnico — historial GPS',
    });
  }

  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: { id: true },
  });
  if (!tracker) throw new AppError('Este estudiante no tiene un localizador vinculado', 404);

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.gPSTelemetry.findMany({
    where: { tracker_id: tracker.id, recorded_at: { gte: since } },
    orderBy: { recorded_at: 'asc' },
    select: {
      id: true, latitude: true, longitude: true, speed: true, heading: true,
      battery_level: true, alert_type: true, source: true, recorded_at: true,
    },
  });
}

// ── Resolución del QR de la tarjeta (asistencia TEACHER / identificación VENDOR) ──
// El QR codifica solo qr_token (opaco, sin relación con el IMEI). Cualquier fallo de
// validez o de autorización devuelve el mismo error genérico, para no confirmar por
// enumeración si un token existe.
export async function resolveStudentByQrToken(
  qrToken: string,
  actorSchoolId: string | null | undefined,
  actorSub: string,
) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { qr_token: qrToken },
    select: {
      student: {
        select: { id: true, full_name: true, grade: true, photo_url: true, school_id: true },
      },
    },
  });

  const student = tracker?.student;
  if (!student) throw new AppError('Código no válido', 404);

  let schoolId = actorSchoolId;
  if (!schoolId) {
    const dbUser = await prisma.user.findUnique({ where: { id: actorSub }, select: { school_id: true } });
    schoolId = dbUser?.school_id;
  }
  if (!schoolId || schoolId !== student.school_id) {
    throw new AppError('Código no válido', 404);
  }

  return student;
}

// ── Ventana de rastreo autorizada (horario escolar ± margen de trayecto, o extendido) ──
// Usado por el servidor TCP para decidir si persiste un punto de telemetría.
const TRAYECTO_MARGIN_MIN = 45;
const BOGOTA_UTC_OFFSET_HOURS = -5;

export async function isTelemetryAllowed(trackerId: string, now: Date = new Date()): Promise<boolean> {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id: trackerId },
    select: {
      extended_tracking_until: true,
      student: {
        select: {
          school: {
            select: { gps_tracking_enabled: true, school_start_time: true, school_end_time: true },
          },
        },
      },
    },
  });
  if (!tracker?.student) return false;
  if (tracker.extended_tracking_until && tracker.extended_tracking_until > now) return true;

  const school = tracker.student.school;
  if (!school.gps_tracking_enabled || !school.school_start_time || !school.school_end_time) return false;

  const bogotaMinutes = ((now.getUTCHours() + BOGOTA_UTC_OFFSET_HOURS + 24) % 24) * 60 + now.getUTCMinutes();
  const [startH, startM] = school.school_start_time.split(':').map(Number) as [number, number];
  const [endH, endM] = school.school_end_time.split(':').map(Number) as [number, number];
  const windowStart = startH * 60 + startM - TRAYECTO_MARGIN_MIN;
  const windowEnd = endH * 60 + endM + TRAYECTO_MARGIN_MIN;

  return bogotaMinutes >= windowStart && bogotaMinutes <= windowEnd;
}
