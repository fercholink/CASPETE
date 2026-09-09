import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { EnrollGuardianInput, UpdateGuardianInput, CustomPlanInput } from './guardian.schemas.js';
import { GPS_MONTHLY_PRICE, GPS_EXTRA_GUARDIAN_PRICE } from '../gps-payments/gps-payment.service.js';
import { sendGuardianInvitationEmail } from '../../lib/email.js';
import { env } from '../../config/env.js';

const guardianUserSelect = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  avatar_url: true,
} as const;

const RELATIONSHIP_LABELS: Record<string, string> = {
  MOTHER: 'Mamá',
  FATHER: 'Papá',
  GRANDPARENT: 'Abuelo(a)',
  UNCLE_AUNT: 'Tío(a)',
  LEGAL_TUTOR: 'Tutor(a) legal',
  FAMILY_OTHER: 'Familiar / Cuidador',
};

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

  try {
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
    }).catch(() => 0);

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
  } catch {
    // Fallback seguro si la base de datos aún no tiene la migración
    return {
      has_tracker: true,
      tracker_id: null,
      base_monthly_price: GPS_MONTHLY_PRICE,
      extra_guardian_price: GPS_EXTRA_GUARDIAN_PRICE,
      included_guardians: 1,
      max_emergency_numbers: 3,
      active_guardians_count: 0,
      extra_guardians_count: 0,
      total_monthly_price: GPS_MONTHLY_PRICE,
      subscription_paid_until: null,
    };
  }
}

// ── Listar familiares del estudiante ───────────────────────────────────────

export async function listStudentGuardians(studentId: string, actor: JwtPayload) {
  await assertParentOwnsStudent(studentId, actor);

  try {
    const guardians = await prisma.studentGuardian.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: 'asc' },
      include: {
        guardian: { select: guardianUserSelect },
      },
    });

    return guardians.map((g) => ({
      ...g,
      guardian: g.guardian ?? {
        id: g.id,
        full_name: 'Invitación Pendiente',
        email: g.guardian_email,
        phone: null,
        avatar_url: null,
      },
    }));
  } catch {
    return [];
  }
}

// ── Enrolar o invitar un familiar ─────────────────────────────────────────

export async function enrollGuardian(studentId: string, input: EnrollGuardianInput, actor: JwtPayload) {
  const student = await assertParentOwnsStudent(studentId, actor);
  const parentUser = await prisma.user.findUnique({
    where: { id: actor.sub },
    select: { full_name: true },
  });

  const cleanEmail = input.email.trim().toLowerCase();

  // 1. Buscar si el usuario ya existe en Kidway
  const targetUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, role: true, full_name: true, active: true },
  });

  if (targetUser && targetUser.id === student.parent_id) {
    throw new AppError('El padre titular ya tiene acceso completo y no puede ser enrolado como familiar adicional.', 400);
  }

  // 2. Verificar si ya existe un registro para este estudiante y correo
  const existing = await prisma.studentGuardian.findUnique({
    where: {
      student_id_guardian_email: {
        student_id: studentId,
        guardian_email: cleanEmail,
      },
    },
  });

  if (existing && existing.active && existing.status === 'ACCEPTED') {
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
  }).catch(() => 0);

  const isIncluded = activeCount < includedLimit;
  const extraPrice = isIncluded ? 0 : (tracker?.custom_guardian_price ? Number(tracker.custom_guardian_price) : GPS_EXTRA_GUARDIAN_PRICE);

  const inviteToken = randomBytes(24).toString('hex');
  const baseUrl = (env.FRONTEND_URL.split(',')[0] ?? 'http://localhost:5173').trim();
  const registerUrl = `${baseUrl}/register?email=${encodeURIComponent(cleanEmail)}&invite_token=${inviteToken}&student_id=${studentId}`;
  const relationshipLabel = RELATIONSHIP_LABELS[input.relationship] ?? 'Familiar';

  // CASO A: El usuario ya está registrado en Kidway con rol PARENT
  if (targetUser && targetUser.role === 'PARENT' && targetUser.active) {
    let result;
    if (existing) {
      result = await prisma.studentGuardian.update({
        where: { id: existing.id },
        data: {
          guardian_id: targetUser.id,
          guardian_email: cleanEmail,
          status: 'ACCEPTED',
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
    } else {
      result = await prisma.studentGuardian.create({
        data: {
          student_id: studentId,
          parent_id: actor.sub,
          guardian_id: targetUser.id,
          guardian_email: cleanEmail,
          status: 'ACCEPTED',
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

    // Notificar al familiar registrado
    await sendGuardianInvitationEmail(
      cleanEmail,
      parentUser?.full_name ?? 'El acudiente',
      student.full_name,
      relationshipLabel,
      `${baseUrl}/tracking`,
    ).catch(() => {});

    return {
      ...result,
      message: `¡${targetUser.full_name} ha sido vinculado al círculo familiar exitosamente!`,
    };
  }

  // CASO B: El usuario aún NO está registrado en Kidway -> Enviar invitación por email
  let pendingRecord;
  if (existing) {
    pendingRecord = await prisma.studentGuardian.update({
      where: { id: existing.id },
      data: {
        guardian_id: null,
        guardian_email: cleanEmail,
        status: 'PENDING',
        invite_token: inviteToken,
        active: true,
        relationship: input.relationship,
        can_view_live: input.can_view_live,
        can_view_history: input.can_view_history,
        can_receive_alerts: input.can_receive_alerts,
        can_view_meals: input.can_view_meals,
        is_included_slot: isIncluded,
        extra_price: extraPrice,
      },
    });
  } else {
    pendingRecord = await prisma.studentGuardian.create({
      data: {
        student_id: studentId,
        parent_id: actor.sub,
        guardian_id: null,
        guardian_email: cleanEmail,
        status: 'PENDING',
        invite_token: inviteToken,
        active: true,
        relationship: input.relationship,
        can_view_live: input.can_view_live,
        can_view_history: input.can_view_history,
        can_receive_alerts: input.can_receive_alerts,
        can_view_meals: input.can_view_meals,
        is_included_slot: isIncluded,
        extra_price: extraPrice,
      },
    });
  }

  // Enviar correo de invitación con plantilla personalizada
  await sendGuardianInvitationEmail(
    cleanEmail,
    parentUser?.full_name ?? 'El acudiente',
    student.full_name,
    relationshipLabel,
    registerUrl,
  ).catch(() => {});

  return {
    ...pendingRecord,
    guardian: {
      id: pendingRecord.id,
      full_name: 'Invitación Pendiente',
      email: cleanEmail,
      phone: null,
      avatar_url: null,
    },
    message: `Invitación enviada por correo a ${cleanEmail}. En cuanto se registre, quedará vinculado automáticamente.`,
  };
}

// ── Reenviar invitación por correo ────────────────────────────────────────

export async function resendGuardianInvitation(studentId: string, guardianRecordId: string, actor: JwtPayload) {
  const student = await assertParentOwnsStudent(studentId, actor);
  const parentUser = await prisma.user.findUnique({
    where: { id: actor.sub },
    select: { full_name: true },
  });

  const record = await prisma.studentGuardian.findUnique({
    where: { id: guardianRecordId },
  });

  if (!record || record.student_id !== studentId) {
    throw new AppError('Invitación no encontrada', 404);
  }

  if (record.status === 'ACCEPTED') {
    throw new AppError('Este familiar ya aceptó la invitación y tiene su cuenta activa.', 400);
  }

  const inviteToken = record.invite_token ?? randomBytes(24).toString('hex');
  if (!record.invite_token) {
    await prisma.studentGuardian.update({
      where: { id: record.id },
      data: { invite_token: inviteToken },
    });
  }

  const baseUrl = (env.FRONTEND_URL.split(',')[0] ?? 'http://localhost:5173').trim();
  const registerUrl = `${baseUrl}/register?email=${encodeURIComponent(record.guardian_email)}&invite_token=${inviteToken}&student_id=${studentId}`;
  const relationshipLabel = RELATIONSHIP_LABELS[record.relationship] ?? 'Familiar';

  await sendGuardianInvitationEmail(
    record.guardian_email,
    parentUser?.full_name ?? 'El acudiente',
    student.full_name,
    relationshipLabel,
    registerUrl,
  );

  return { success: true, message: `Invitación reenviada a ${record.guardian_email}` };
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

// ── Eliminar o cancelar invitación ────────────────────────────────────────

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
  try {
    const shares = await prisma.studentGuardian.findMany({
      where: { guardian_id: actor.sub, active: true, status: 'ACCEPTED' },
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
  } catch {
    return [];
  }
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
