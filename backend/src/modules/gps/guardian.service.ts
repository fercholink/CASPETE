import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { EnrollGuardianInput, UpdateGuardianInput, CustomPlanInput } from './guardian.schemas.js';
import { GPS_MONTHLY_PRICE, GPS_EXTRA_GUARDIAN_PRICE } from '../gps-payments/gps-payment.service.js';

const guardianUserSelect = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  avatar_url: true,
} as const;

async function assertParentOwnsStudent(studentId: string, actor: JwtPayload) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parent_id: true, school_id: true, full_name: true },
  });
  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (actor.role === 'SUPER_ADMIN') return student;
  if (actor.role === 'PARENT' && student.parent_id === actor.sub) return student;
  throw new AppError('No tienes permiso para administrar familiares de este estudiante', 403);
}

// ── Resumen de plan y costos ───────────────────────────────────────────────

export async function getStudentPlanSummary(studentId: string, actor: JwtPayload) {
  await assertParentOwnsStudent(studentId, actor);

  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: {
      id: true,
      imei: true,
      device_name: true,
      subscription_paid_until: true,
      included_guardians: true,
      custom_monthly_price: true,
      custom_guardian_price: true,
      max_emergency_numbers: true,
    },
  });

  const basePrice = tracker?.custom_monthly_price ? Number(tracker.custom_monthly_price) : GPS_MONTHLY_PRICE;
  const extraPrice = tracker?.custom_guardian_price ? Number(tracker.custom_guardian_price) : GPS_EXTRA_GUARDIAN_PRICE;
  const includedCount = tracker?.included_guardians ?? 1;
  const maxEmergencyNumbers = tracker?.max_emergency_numbers ?? 3;

  const activeGuardians = await prisma.studentGuardian.count({
    where: { student_id: studentId, active: true },
  });

  const extraGuardians = Math.max(0, activeGuardians - includedCount);
  const totalMonthlyPrice = basePrice + (extraGuardians * extraPrice);

  return {
    has_tracker: Boolean(tracker),
    tracker_id: tracker?.id ?? null,
    base_monthly_price: basePrice,
    extra_guardian_price: extraPrice,
    included_guardians: includedCount,
    max_emergency_numbers: maxEmergencyNumbers,
    active_guardians_count: activeGuardians,
    extra_guardians_count: extraGuardians,
    total_monthly_price: totalMonthlyPrice,
    subscription_paid_until: tracker?.subscription_paid_until ?? null,
  };
}

// ── Listar familiares del estudiante ───────────────────────────────────────

export async function listStudentGuardians(studentId: string, actor: JwtPayload) {
  await assertParentOwnsStudent(studentId, actor);

  const guardians = await prisma.studentGuardian.findMany({
    where: { student_id: studentId },
    orderBy: { created_at: 'asc' },
    include: {
      guardian: { select: guardianUserSelect },
    },
  });

  return guardians;
}

// ── Enrolar un familiar ───────────────────────────────────────────────────

export async function enrollGuardian(studentId: string, input: EnrollGuardianInput, actor: JwtPayload) {
  const student = await assertParentOwnsStudent(studentId, actor);

  // 1. Buscar usuario por correo
  const targetUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, role: true, full_name: true, active: true },
  });

  if (!targetUser || targetUser.role !== 'PARENT' || !targetUser.active) {
    throw new AppError(
      `El usuario con el correo "${input.email}" no está registrado como acudiente en Kidway. Pídele que cree su cuenta primero.`,
      404,
    );
  }

  if (targetUser.id === student.parent_id) {
    throw new AppError('El padre titular ya tiene acceso completo y no puede ser enrolado como familiar adicional.', 400);
  }

  // 2. Verificar si ya está enrolado
  const existing = await prisma.studentGuardian.findUnique({
    where: {
      student_id_guardian_id: {
        student_id: studentId,
        guardian_id: targetUser.id,
      },
    },
  });

  if (existing && existing.active) {
    throw new AppError('Este familiar ya se encuentra activo en el círculo de confianza de este estudiante.', 409);
  }

  // 3. Evaluar cupo incluido vs adicional
  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: { included_guardians: true, custom_guardian_price: true },
  });

  const includedLimit = tracker?.included_guardians ?? 1;
  const activeCount = await prisma.studentGuardian.count({
    where: { student_id: studentId, active: true },
  });

  const isIncluded = activeCount < includedLimit;
  const extraPrice = isIncluded ? 0 : (tracker?.custom_guardian_price ? Number(tracker.custom_guardian_price) : GPS_EXTRA_GUARDIAN_PRICE);

  if (existing) {
    // Reactivar
    return prisma.studentGuardian.update({
      where: { id: existing.id },
      data: {
        active: true,
        relationship: input.relationship,
        can_view_live: input.can_view_live,
        can_view_history: input.can_view_history,
        can_receive_alerts: input.can_receive_alerts,
        can_view_meals: input.can_view_meals,
        is_included_slot: isIncluded,
        extra_price: extraPrice,
      },
      include: { guardian: { select: guardianUserSelect } },
    });
  }

  return prisma.studentGuardian.create({
    data: {
      student_id: studentId,
      parent_id: actor.sub,
      guardian_id: targetUser.id,
      relationship: input.relationship,
      can_view_live: input.can_view_live,
      can_view_history: input.can_view_history,
      can_receive_alerts: input.can_receive_alerts,
      can_view_meals: input.can_view_meals,
      is_included_slot: isIncluded,
      extra_price: extraPrice,
    },
    include: { guardian: { select: guardianUserSelect } },
  });
}

// ── Actualizar permisos de un familiar ────────────────────────────────────

export async function updateGuardian(
  studentId: string,
  guardianRecordId: string,
  input: UpdateGuardianInput,
  actor: JwtPayload,
) {
  await assertParentOwnsStudent(studentId, actor);

  const record = await prisma.studentGuardian.findUnique({
    where: { id: guardianRecordId },
  });
  if (!record || record.student_id !== studentId) {
    throw new AppError('Registro de familiar no encontrado', 404);
  }

  return prisma.studentGuardian.update({
    where: { id: guardianRecordId },
    data: {
      ...(input.relationship !== undefined && { relationship: input.relationship }),
      ...(input.can_view_live !== undefined && { can_view_live: input.can_view_live }),
      ...(input.can_view_history !== undefined && { can_view_history: input.can_view_history }),
      ...(input.can_receive_alerts !== undefined && { can_receive_alerts: input.can_receive_alerts }),
      ...(input.can_view_meals !== undefined && { can_view_meals: input.can_view_meals }),
      ...(input.active !== undefined && { active: input.active }),
    },
    include: { guardian: { select: guardianUserSelect } },
  });
}

// ── Eliminar o dar de baja a un familiar ───────────────────────────────────

export async function deleteGuardian(studentId: string, guardianRecordId: string, actor: JwtPayload) {
  await assertParentOwnsStudent(studentId, actor);

  const record = await prisma.studentGuardian.findUnique({
    where: { id: guardianRecordId },
  });
  if (!record || record.student_id !== studentId) {
    throw new AppError('Registro de familiar no encontrado', 404);
  }

  await prisma.studentGuardian.delete({
    where: { id: guardianRecordId },
  });

  // Re-balancear cupos incluidos para los que queden activos
  const tracker = await prisma.gPSTracker.findUnique({
    where: { student_id: studentId },
    select: { included_guardians: true, custom_guardian_price: true },
  });
  const includedLimit = tracker?.included_guardians ?? 1;
  const extraPrice = tracker?.custom_guardian_price ? Number(tracker.custom_guardian_price) : GPS_EXTRA_GUARDIAN_PRICE;

  const remaining = await prisma.studentGuardian.findMany({
    where: { student_id: studentId, active: true },
    orderBy: { created_at: 'asc' },
  });

  let idx = 0;
  for (const guardian of remaining) {
    const isIncluded = idx < includedLimit;
    const price = isIncluded ? 0 : extraPrice;
    await prisma.studentGuardian.update({
      where: { id: guardian.id },
      data: { is_included_slot: isIncluded, extra_price: price },
    });
    idx++;
  }

  return { success: true };
}

// ── Estudiantes compartidos con el usuario logueado (como familiar) ────────

export async function getMySharedStudents(actor: JwtPayload) {
  const shares = await prisma.studentGuardian.findMany({
    where: { guardian_id: actor.sub, active: true },
    include: {
      student: {
        select: {
          id: true,
          full_name: true,
          photo_url: true,
          grade: true,
          school: { select: { id: true, name: true } },
          gps_tracker: {
            select: {
              id: true,
              device_name: true,
              battery_level: true,
              signal_strength: true,
              online: true,
              last_seen_at: true,
            },
          },
        },
      },
      parent: {
        select: { id: true, full_name: true, email: true },
      },
    },
  });

  return shares.map((s) => ({
    share_id: s.id,
    relationship: s.relationship,
    can_view_live: s.can_view_live,
    can_view_history: s.can_view_history,
    can_receive_alerts: s.can_receive_alerts,
    can_view_meals: s.can_view_meals,
    student: s.student,
    owner_parent: s.parent,
  }));
}

// ── Personalización de Plan por SuperAdmin ─────────────────────────────────

export async function updateTrackerCustomPlan(
  trackerId: string,
  input: CustomPlanInput,
  actor: JwtPayload,
) {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo el Super Administrador puede personalizar el plan de un dispositivo', 403);
  }

  const tracker = await prisma.gPSTracker.findUnique({
    where: { id: trackerId },
  });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);

  return prisma.gPSTracker.update({
    where: { id: trackerId },
    data: {
      ...(input.included_guardians !== undefined && { included_guardians: input.included_guardians }),
      ...(input.custom_monthly_price !== undefined && { custom_monthly_price: input.custom_monthly_price }),
      ...(input.custom_guardian_price !== undefined && { custom_guardian_price: input.custom_guardian_price }),
      ...(input.max_emergency_numbers !== undefined && { max_emergency_numbers: input.max_emergency_numbers }),
    },
  });
}
