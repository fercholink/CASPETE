import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { UpsertMenuDayInput } from './menu.schemas.js';

const menuDaySelect = {
  id: true,
  school_id: true,
  menu_date: true,
  soup: true,
  main_protein: true,
  optional_protein: true,
  energetic: true,
  dessert: true,
  vegetarian_available: true,
  allergens: { select: { allergy: { select: { id: true, name: true, severity: true } } } },
} as const;

function parseDate(date: string) {
  const menuDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(menuDate.getTime())) throw new AppError('Fecha inválida, use formato YYYY-MM-DD', 400);
  return menuDate;
}

export async function upsertMenuDay(schoolId: string, date: string, input: UpsertMenuDayInput) {
  const menuDate = parseDate(date);
  const { allergy_ids, ...data } = input;

  const day = await prisma.menuDay.upsert({
    where: { school_id_menu_date: { school_id: schoolId, menu_date: menuDate } },
    update: data,
    create: { school_id: schoolId, menu_date: menuDate, ...data },
    select: { id: true },
  });

  if (allergy_ids !== undefined) {
    await prisma.$transaction([
      prisma.menuDayAllergen.deleteMany({ where: { menu_day_id: day.id } }),
      ...(allergy_ids.length > 0
        ? [
            prisma.menuDayAllergen.createMany({
              data: allergy_ids.map((allergy_id) => ({ menu_day_id: day.id, allergy_id })),
            }),
          ]
        : []),
    ]);
  }

  return prisma.menuDay.findUniqueOrThrow({ where: { id: day.id }, select: menuDaySelect });
}

export async function listMonth(schoolId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return prisma.menuDay.findMany({
    where: { school_id: schoolId, menu_date: { gte: start, lt: end } },
    orderBy: { menu_date: 'asc' },
    select: menuDaySelect,
  });
}

export async function deleteMenuDay(schoolId: string, date: string) {
  const menuDate = parseDate(date);
  const existing = await prisma.menuDay.findUnique({
    where: { school_id_menu_date: { school_id: schoolId, menu_date: menuDate } },
  });
  if (!existing) throw new AppError('No hay menú registrado para esa fecha', 404);
  await prisma.menuDay.delete({ where: { id: existing.id } });
}
