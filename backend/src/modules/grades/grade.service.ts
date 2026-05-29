import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateGradeInput, UpdateGradeInput } from './grade.schemas.js';

async function getActorTeacher(actor: JwtPayload) {
  if (actor.role !== 'TEACHER') return null;
  const teacher = await prisma.teacher.findUnique({ where: { user_id: actor.sub } });
  if (!teacher) throw new AppError('Perfil de docente no encontrado', 404);
  return teacher;
}

export async function createGrade(input: CreateGradeInput, actor: JwtPayload) {
  const course = await prisma.course.findUnique({
    where: { id: input.course_id },
  });
  if (!course) throw new AppError('Curso no encontrado', 404);

  // Multi-tenant check
  if (actor.role !== 'SUPER_ADMIN' && course.school_id !== actor.schoolId) {
    throw new AppError('No tienes acceso a este colegio', 403);
  }

  // Teacher check
  const teacher = await getActorTeacher(actor);
  if (teacher && course.teacher_id !== teacher.id) {
    throw new AppError('No estás asignado como docente de este curso', 403);
  }

  // Verify enrollment
  const enrollment = await prisma.course.findFirst({
    where: {
      id: input.course_id,
      students: {
        some: {
          id: input.student_id,
        },
      },
    },
  });
  if (!enrollment) {
    throw new AppError('El estudiante no está matriculado en este curso', 400);
  }

  return prisma.grade.create({
    data: {
      course_id: input.course_id,
      student_id: input.student_id,
      teacher_id: course.teacher_id,
      score: input.score,
      evaluation_name: input.evaluation_name,
      comments: input.comments ?? null,
    },
    include: {
      student: {
        select: {
          full_name: true,
          national_id: true,
        },
      },
      course: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listGrades(
  actor: JwtPayload,
  filters?: { course_id?: string; student_id?: string; page?: number; limit?: number },
) {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Scope by school
  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.course = {
      school_id: actor.schoolId,
    };

    // Role boundaries
    if (actor.role === 'TEACHER') {
      const teacher = await getActorTeacher(actor);
      if (teacher) {
        where.teacher_id = teacher.id;
      }
    } else if (actor.role === 'PARENT') {
      // Parents can only see grades of their students
      where.student = {
        parent_id: actor.sub,
      };
    }
  }

  if (filters?.course_id) {
    where.course_id = filters.course_id;
  }

  if (filters?.student_id) {
    // Extra validation for parent: ensure student belongs to parent
    if (actor.role === 'PARENT') {
      const student = await prisma.student.findFirst({
        where: { id: filters.student_id, parent_id: actor.sub },
      });
      if (!student) throw new AppError('No tienes acceso a este estudiante', 403);
    }
    where.student_id = filters.student_id;
  }

  const [grades, total] = await prisma.$transaction([
    prisma.grade.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        student: {
          select: {
            id: true,
            full_name: true,
            national_id: true,
            grade: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.grade.count({ where }),
  ]);

  return { grades, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getGrade(id: string, actor: JwtPayload) {
  const grade = await prisma.grade.findUnique({
    where: { id },
    include: {
      course: true,
      student: true,
    },
  });

  if (!grade) throw new AppError('Calificación no encontrada', 404);

  // Multi-tenant and role check
  if (actor.role !== 'SUPER_ADMIN' && grade.course.school_id !== actor.schoolId) {
    throw new AppError('No tienes acceso a este colegio', 403);
  }

  if (actor.role === 'TEACHER') {
    const teacher = await getActorTeacher(actor);
    if (teacher && grade.teacher_id !== teacher.id) {
      throw new AppError('No tienes acceso a esta calificación', 403);
    }
  } else if (actor.role === 'PARENT' && grade.student.parent_id !== actor.sub) {
    throw new AppError('No tienes acceso a esta calificación', 403);
  }

  return grade;
}

export async function updateGrade(id: string, input: UpdateGradeInput, actor: JwtPayload) {
  const grade = await prisma.grade.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!grade) throw new AppError('Calificación no encontrada', 404);

  // Multi-tenant
  if (actor.role !== 'SUPER_ADMIN' && grade.course.school_id !== actor.schoolId) {
    throw new AppError('No tienes acceso a este colegio', 403);
  }

  // Teacher ownership
  if (actor.role === 'TEACHER') {
    const teacher = await getActorTeacher(actor);
    if (teacher && grade.teacher_id !== teacher.id) {
      throw new AppError('No tienes acceso a esta calificación', 403);
    }
  } else if (actor.role !== 'SCHOOL_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permisos para modificar esta calificación', 403);
  }

  const data: any = {};
  if (input.score !== undefined) data.score = input.score;
  if (input.evaluation_name !== undefined) data.evaluation_name = input.evaluation_name;
  if (input.comments !== undefined) data.comments = input.comments;

  return prisma.grade.update({
    where: { id },
    data,
    include: {
      student: {
        select: {
          full_name: true,
        },
      },
      course: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function deleteGrade(id: string, actor: JwtPayload) {
  const grade = await prisma.grade.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!grade) throw new AppError('Calificación no encontrada', 404);

  // Multi-tenant
  if (actor.role !== 'SUPER_ADMIN' && grade.course.school_id !== actor.schoolId) {
    throw new AppError('No tienes acceso a este colegio', 403);
  }

  // Teacher ownership
  if (actor.role === 'TEACHER') {
    const teacher = await getActorTeacher(actor);
    if (teacher && grade.teacher_id !== teacher.id) {
      throw new AppError('No tienes acceso a esta calificación', 403);
    }
  } else if (actor.role !== 'SCHOOL_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new AppError('No tienes permisos para eliminar esta calificación', 403);
  }

  await prisma.grade.delete({ where: { id } });
}
