import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { CreateSchoolInput, UpdateSchoolInput } from './school.schemas.js';

const schoolSelect = {
  id: true,
  name: true,
  nit: true,
  city: true,
  address: true,
  plan: true,
  active: true,
  created_at: true,
  _count: { select: { users: true, students: true, stores: true } },
} as const;

export async function createSchool(input: CreateSchoolInput) {
  if (input.nit) {
    const existing = await prisma.school.findUnique({ where: { nit: input.nit } });
    if (existing) throw new AppError('Ya existe un colegio con ese NIT', 409);
  }
  return prisma.school.create({
    data: {
      name: input.name,
      city: input.city,
      plan: input.plan,
      nit: input.nit ?? null,
      address: input.address ?? null,
    },
    select: schoolSelect,
  });
}

export async function listSchools(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [schools, total] = await prisma.$transaction([
    prisma.school.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: schoolSelect,
    }),
    prisma.school.count(),
  ]);
  return { schools, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getSchool(id: string) {
  const school = await prisma.school.findUnique({
    where: { id },
    select: schoolSelect,
  });
  if (!school) throw new AppError('Colegio no encontrado', 404);
  return school;
}

export async function updateSchool(id: string, input: UpdateSchoolInput) {
  await getSchool(id);
  if (input.nit) {
    const conflict = await prisma.school.findFirst({
      where: { nit: input.nit, id: { not: id } },
    });
    if (conflict) throw new AppError('Ya existe un colegio con ese NIT', 409);
  }
  return prisma.school.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.plan !== undefined && { plan: input.plan }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.nit !== undefined && { nit: input.nit }),
      ...(input.address !== undefined && { address: input.address }),
    },
    select: schoolSelect,
  });
}

export async function listActiveSchools() {
  return prisma.school.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, city: true, plan: true },
  });
}

export async function deactivateSchool(id: string) {
  await getSchool(id);
  return prisma.school.update({
    where: { id },
    data: { active: false },
    select: schoolSelect,
  });
}
