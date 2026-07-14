import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { resolveStudentByQrToken } from '../gps/gps.service.js';
import type { ScanAttendanceInput } from './attendance.schemas.js';

const attendanceSelect = {
  id: true,
  scanned_at: true,
  type: true,
  student: { select: { id: true, full_name: true, grade: true, photo_url: true } },
} as const;

async function getTeacherOrThrow(actor: JwtPayload) {
  const teacher = await prisma.teacher.findUnique({
    where: { user_id: actor.sub },
    select: { id: true, school_id: true },
  });
  if (!teacher) throw new AppError('Tu cuenta no está registrada como docente', 403);
  return teacher;
}

export async function scanForAttendance(input: ScanAttendanceInput, actor: JwtPayload) {
  const teacher = await getTeacherOrThrow(actor);

  const school = await prisma.school.findUnique({
    where: { id: teacher.school_id },
    select: { attendance_qr_enabled: true },
  });
  if (!school?.attendance_qr_enabled) {
    throw new AppError('Tu colegio no tiene habilitada la asistencia por QR', 403);
  }

  const student = await resolveStudentByQrToken(input.qr_token, actor.schoolId ?? teacher.school_id, actor.sub);

  const course = await prisma.course.findUnique({
    where: { id: input.course_id },
    select: { teacher_id: true, students: { where: { id: student.id }, select: { id: true } } },
  });
  if (!course || course.teacher_id !== teacher.id) {
    throw new AppError('No tienes permiso para tomar asistencia en este curso', 403);
  }
  if (course.students.length === 0) {
    throw new AppError('Este estudiante no está matriculado en este curso', 400);
  }

  return prisma.attendance.create({
    data: {
      student_id: student.id,
      course_id: input.course_id,
      teacher_id: teacher.id,
      type: 'CLASS_ARRIVAL',
    },
    select: attendanceSelect,
  });
}

export async function listAttendanceForCourse(courseId: string, actor: JwtPayload) {
  const teacher = await getTeacherOrThrow(actor);

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacher_id: true } });
  if (!course || course.teacher_id !== teacher.id) {
    throw new AppError('No tienes permiso para ver la asistencia de este curso', 403);
  }

  return prisma.attendance.findMany({
    where: { course_id: courseId },
    orderBy: { scanned_at: 'desc' },
    select: attendanceSelect,
  });
}
