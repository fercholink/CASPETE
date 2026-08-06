import { randomBytes } from 'crypto';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logAudit } from '../../middleware/audit-log.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { LinkTrackerInput, EmergencyContactsInput } from './gps.schemas.js';
import * as gpsPlatform from '../../lib/gpsPlatform.js';
import { syncStudentRoute } from '../../lib/routeSync.js';

// qr_token solo se expone al dueño (padre) o SUPER_ADMIN vía estos endpoints —
// necesario para poder mostrar/imprimir el QR físico de la tarjeta.
// battery_level/signal_strength/online/last_seen_at ya no se guardan localmente:
// el dispositivo real conecta a la Plataforma GPS externa, así que ese estado se
// consulta en vivo vía platform_tracker_id (ver buildTrackerInfo).
const trackerSelect = {
  id: true,
  qr_token: true,
  device_name: true,
  extended_tracking_until: true,
  active: true,
  platform_tracker_id: true,
} as const;

type LocalTracker = {
  id: string;
  qr_token: string;
  device_name: string | null;
  extended_tracking_until: Date | null;
  active: boolean;
};

function buildTrackerInfo(local: LocalTracker, platform: gpsPlatform.PlatformTracker | null) {
  return {
    id: local.id,
    qr_token: local.qr_token,
    device_name: local.device_name ?? platform?.device_name ?? null,
    battery_level: platform?.battery_level ?? null,
    signal_strength: platform?.signal_strength ?? null,
    online: platform?.online ?? false,
    last_seen_at: platform?.last_seen_at ?? null,
    extended_tracking_until: local.extended_tracking_until,
    active: local.active,
    sos_number: platform?.sos_number ?? null,
    dad_number: platform?.dad_number ?? null,
    mom_number: platform?.mom_number ?? null,
  };
}

function mapPosition(p: gpsPlatform.PlatformPosition) {
  return {
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    speed: p.speed,
    heading: p.heading,
    recorded_at: p.recorded_at,
  };
}

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
  const student = await assertParentOwnsStudent(input.student_id, actor);

  const existingForStudent = await prisma.gPSTracker.findUnique({
    where: { student_id: input.student_id },
  });
  if (existingForStudent) throw new AppError('Este estudiante ya tiene un localizador vinculado', 409);

  // Un IMEI ya registrado pero sin estudiante (huérfano, de una desvinculación
  // previa) se reutiliza en vez de rechazarse — desvincular no libera la fila,
  // solo la desengancha del estudiante anterior.
  const existingImei = await prisma.gPSTracker.findUnique({ where: { imei: input.imei } });
  if (existingImei?.student_id) throw new AppError('Este IMEI ya está registrado en otra tarjeta', 409);

  const platformTracker = await gpsPlatform.registerTracker(input.imei, input.student_id, input.device_name);

  const tracker = existingImei
    ? await prisma.gPSTracker.update({
        where: { id: existingImei.id },
        data: {
          student_id: input.student_id,
          device_name: input.device_name ?? existingImei.device_name,
          platform_tracker_id: platformTracker.id,
        },
        select: trackerSelect,
      })
    : await prisma.gPSTracker.create({
        data: {
          imei: input.imei,
          qr_token: randomBytes(24).toString('hex'),
          student_id: input.student_id,
          device_name: input.device_name ?? null,
          platform_tracker_id: platformTracker.id,
        },
        select: trackerSelect,
      });

  // Si el colegio ya tiene geocerca configurada, vincula esta tarjeta para
  // que empiece a recibir alertas de "llegó/salió del colegio" (best-effort).
  const school = await prisma.school.findUnique({
    where: { id: student.school_id },
    select: { gps_geofence_id: true },
  });
  if (school?.gps_geofence_id) {
    await gpsPlatform.linkTrackerToGeofence(school.gps_geofence_id, platformTracker.id).catch((err) => {
      console.error('[GPS] No se pudo vincular la tarjeta a la geocerca del colegio:', err);
    });
  }

  // Si el estudiante ya tenía ubicación de casa guardada, sincroniza la georuta ahora que hay tarjeta.
  await syncStudentRoute(input.student_id);

  return buildTrackerInfo(tracker, platformTracker);
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

// El dispositivo llama a estos números al presionar su botón físico de SOS.
export async function setEmergencyContacts(id: string, input: EmergencyContactsInput, actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id },
    select: { id: true, platform_tracker_id: true, student: { select: { parent_id: true } } },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para configurar este localizador', 403);
  }
  if (!tracker.platform_tracker_id) {
    throw new AppError('Este localizador todavía no está sincronizado con la Plataforma GPS', 409);
  }

  return gpsPlatform.setEmergencyContacts(tracker.platform_tracker_id, input);
}

// Hace sonar el parlante de la tarjeta (si tiene) — para encontrarla si se extravió en casa.
export async function findDevice(id: string, active: boolean, actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id },
    select: { platform_tracker_id: true, student: { select: { parent_id: true } } },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para usar este localizador', 403);
  }
  if (!tracker.platform_tracker_id) {
    throw new AppError('Este localizador todavía no está sincronizado con la Plataforma GPS', 409);
  }

  await gpsPlatform.findDevice(tracker.platform_tracker_id, active);
}

// Apaga la tarjeta — sin comando de vuelta, exige botón físico o cargador para reencenderla.
export async function sendPowerAction(id: string, action: 'restart' | 'shutdown', actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id },
    select: { platform_tracker_id: true, student: { select: { parent_id: true } } },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para usar este localizador', 403);
  }
  if (!tracker.platform_tracker_id) {
    throw new AppError('Este localizador todavía no está sincronizado con la Plataforma GPS', 409);
  }

  await gpsPlatform.sendPowerAction(tracker.platform_tracker_id, action);
}

// Alarma de despertador de la tarjeta (hasta 3 horarios).
export async function setAlarmClock(id: string, alarms: gpsPlatform.AlarmClockEntry[], actor: JwtPayload) {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id },
    select: { platform_tracker_id: true, student: { select: { parent_id: true } } },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para usar este localizador', 403);
  }
  if (!tracker.platform_tracker_id) {
    throw new AppError('Este localizador todavía no está sincronizado con la Plataforma GPS', 409);
  }

  await gpsPlatform.setAlarmClock(tracker.platform_tracker_id, alarms);
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
    select: trackerSelect,
  });
  if (!tracker) throw new AppError('Este estudiante no tiene un localizador vinculado', 404);

  const [platformStatus, allowed] = await Promise.all([
    tracker.platform_tracker_id ? gpsPlatform.getTrackerStatus(tracker.platform_tracker_id) : null,
    isTelemetryAllowed(tracker.id),
  ]);

  const trackerInfo = buildTrackerInfo(tracker, platformStatus);

  if (!allowed || !tracker.platform_tracker_id) {
    return { tracker: trackerInfo, location: null };
  }

  const position = await gpsPlatform.getLatestPosition(tracker.platform_tracker_id);
  return { tracker: trackerInfo, location: position ? mapPosition(position) : null };
}

export async function getHistory(
  studentId: string,
  opts: { hours: number; date?: string },
  actor: JwtPayload,
  req: Request,
) {
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
    select: { id: true, platform_tracker_id: true },
  });
  if (!tracker) throw new AppError('Este estudiante no tiene un localizador vinculado', 404);

  const allowed = await isTelemetryAllowed(tracker.id);
  if (!allowed || !tracker.platform_tracker_id) return [];

  const positions = opts.date
    ? await gpsPlatform.getPositionHistoryForDay(tracker.platform_tracker_id, opts.date)
    : await gpsPlatform.getPositionHistory(tracker.platform_tracker_id, opts.hours);
  return positions.map(mapPosition);
}

// La ruta esperada (línea por calles o recorrido real guardado) — solo para
// dibujarla en el mapa junto al recorrido real, no para las alertas (esas
// las evalúa la Plataforma GPS sola).
export async function getExpectedRoute(studentId: string, actor: JwtPayload) {
  await assertParentOwnsStudent(studentId, actor);

  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: { platform_route_id: true },
  });
  if (!tracker?.platform_route_id) return null;

  const route = await gpsPlatform.getRoute(tracker.platform_route_id);
  return route ? { points: route.points } : null;
}

// Reemplaza la línea recta casa→colegio (o la ruta guardada anteriormente) por
// el recorrido real de las últimas `hours` — el padre lo confirma a mano
// después de revisar en el mapa que ese día fue un trayecto normal.
const RECORDED_ROUTE_CORRIDOR_METERS = 150;

export async function saveRouteFromHistory(
  studentId: string,
  opts: { hours: number; date?: string },
  actor: JwtPayload,
) {
  const student = await assertParentOwnsStudent(studentId, actor);

  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: { id: true, platform_tracker_id: true, platform_route_id: true },
  });
  if (!tracker?.platform_tracker_id) throw new AppError('Este estudiante no tiene un localizador vinculado', 404);

  const positions = opts.date
    ? await gpsPlatform.getPositionHistoryForDay(tracker.platform_tracker_id, opts.date)
    : await gpsPlatform.getPositionHistory(tracker.platform_tracker_id, opts.hours);
  if (positions.length < 2) {
    throw new AppError('No hay suficiente recorrido guardado todavía para usarlo como ruta normal', 400);
  }

  const points = positions.map((p) => ({ lat: Number(p.latitude), lon: Number(p.longitude) }));
  const studentRecord = await prisma.student.findUnique({ where: { id: student.id }, select: { full_name: true } });

  const route = await gpsPlatform.upsertRoute(
    tracker.platform_route_id,
    `Casa-colegio: ${studentRecord?.full_name ?? ''} (recorrido real)`,
    points,
    RECORDED_ROUTE_CORRIDOR_METERS,
  );

  if (route.id !== tracker.platform_route_id) {
    await prisma.gPSTracker.update({ where: { id: tracker.id }, data: { platform_route_id: route.id } });
  }
  await gpsPlatform.linkTrackerToRoute(route.id, tracker.platform_tracker_id);

  return { route_id: route.id, points_saved: points.length };
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
// La Plataforma GPS guarda telemetría sin condición; Kidway decide en tiempo de
// lectura si se la muestra al padre según esta ventana.
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
