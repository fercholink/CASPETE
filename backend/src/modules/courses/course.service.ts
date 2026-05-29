import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateCourseInput, UpdateCourseInput } from './course.schemas.js';

function assertSchoolAccess(schoolId: string, actor: JwtPayload) {
  if (actor.role === 'SUPER_ADMIN') return;
  if (actor.schoolId && schoolId === actor.schoolId) return;
  throw new AppError('No tienes acceso a este colegio', 403);
}

export async function createCourse(input: CreateCourseInput, actor: JwtPayload) {
  const schoolId = actor.role === 'SUPER_ADMIN' ? input.school_id : actor.schoolId;
  if (!schoolId) throw new AppError('school_id es requerido', 400);
  assertSchoolAccess(schoolId, actor);

  // Validate teacher belongs to the same school
  const teacher = await prisma.teacher.findUnique({
    where: { id: input.teacher_id },
    include: { user: true },
  });
  if (!teacher || teacher.school_id !== schoolId) {
    throw new AppError('El docente seleccionado no pertenece a este colegio', 400);
  }

  return prisma.course.create({
    data: {
      name: input.name,
      academic_period: input.academic_period ?? null,
      school_id: schoolId,
      teacher_id: input.teacher_id,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function listCourses(
  actor: JwtPayload,
  filters?: { search?: string; teacher_id?: string; student_id?: string; page?: number; limit?: number },
) {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Scope by school
  if (actor.role !== 'SUPER_ADMIN') {
    if (!actor.schoolId) throw new AppError('Tu cuenta no tiene colegio asignado', 403);
    where.school_id = actor.schoolId;

    // Additional role boundaries
    if (actor.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: actor.sub } });
      if (!teacher) throw new AppError('Perfil de docente no encontrado', 404);
      where.teacher_id = teacher.id;
    } else if (actor.role === 'PARENT') {
      // Parents can see courses where their kids are enrolled
      where.students = {
        some: {
          parent_id: actor.sub,
        },
      };
    }
  }

  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  if (filters?.teacher_id) {
    where.teacher_id = filters.teacher_id;
  }

  if (filters?.student_id) {
    where.students = {
      some: {
        id: filters.student_id,
      },
    };
  }

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getCourse(id: string, actor: JwtPayload) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },
      students: {
        select: {
          id: true,
          full_name: true,
          national_id: true,
          grade: true,
        },
        orderBy: {
          full_name: 'asc',
        },
      },
      school: true,
    },
  });

  if (!course) throw new AppError('Curso no encontrado', 404);
  assertSchoolAccess(course.school_id, actor);
  return course;
}

export async function updateCourse(id: string, input: UpdateCourseInput, actor: JwtPayload) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Curso no encontrado', 404);
  assertSchoolAccess(course.school_id, actor);

  // If teacher is being updated, validate teacher belongs to same school
  if (input.teacher_id) {
    const teacher = await prisma.teacher.findUnique({ where: { id: input.teacher_id } });
    if (!teacher || teacher.school_id !== course.school_id) {
      throw new AppError('El docente seleccionado no pertenece a este colegio', 400);
    }
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.academic_period !== undefined) data.academic_period = input.academic_period;
  if (input.teacher_id !== undefined) data.teacher_id = input.teacher_id;

  if (input.student_ids !== undefined) {
    // Verify that all students belong to the same school
    const studentsCount = await prisma.student.count({
      where: {
        id: { in: input.student_ids },
        school_id: course.school_id,
      },
    });

    if (studentsCount !== input.student_ids.length) {
      throw new AppError('Uno o más estudiantes no pertenecen al mismo colegio o no existen', 400);
    }

    data.students = {
      set: input.student_ids.map((id) => ({ id })),
    };
  }

  return prisma.course.update({
    where: { id },
    data,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },
      students: {
        select: {
          id: true,
          full_name: true,
          national_id: true,
          grade: true,
        },
        orderBy: {
          full_name: 'asc',
        },
      },
    },
  });
}

export async function deleteCourse(id: string, actor: JwtPayload) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Curso no encontrado', 404);
  assertSchoolAccess(course.school_id, actor);

  await prisma.course.delete({ where: { id } });
}

export async function syncStudents(courseId: string, studentIds: string[], actor: JwtPayload) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Curso no encontrado', 404);
  assertSchoolAccess(course.school_id, actor);

  // Verify that all students belong to the same school
  const studentsCount = await prisma.student.count({
    where: {
      id: { in: studentIds },
      school_id: course.school_id,
    },
  });

  if (studentsCount !== studentIds.length) {
    throw new AppError('Uno o más estudiantes no pertenecen al mismo colegio o no existen', 400);
  }

  return prisma.course.update({
    where: { id: courseId },
    data: {
      students: {
        set: studentIds.map((id) => ({ id })),
      },
    },
    include: {
      students: {
        select: {
          id: true,
          full_name: true,
          national_id: true,
          grade: true,
        },
        orderBy: {
          full_name: 'asc',
        },
      },
    },
  });
}
