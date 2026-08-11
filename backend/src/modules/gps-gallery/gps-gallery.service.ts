import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const gallerySelect = {
  id: true, image_url: true, caption: true, active: true, sort_order: true,
} as const;

/** Lista imágenes activas (público, landing) */
export async function listActive() {
  return prisma.gpsGalleryImage.findMany({
    where: { active: true },
    orderBy: { sort_order: 'asc' },
    select: gallerySelect,
  });
}

/** Lista todas (admin) */
export async function listAll() {
  return prisma.gpsGalleryImage.findMany({
    orderBy: { sort_order: 'asc' },
    select: { ...gallerySelect, created_at: true, updated_at: true },
  });
}

/** Crear imagen */
export async function create(data: { image_url: string; caption?: string; sort_order?: number }) {
  return prisma.gpsGalleryImage.create({ data, select: gallerySelect });
}

/** Actualizar imagen */
export async function update(id: string, data: {
  image_url?: string; caption?: string; active?: boolean; sort_order?: number;
}) {
  const existing = await prisma.gpsGalleryImage.findUnique({ where: { id } });
  if (!existing) throw new AppError('Imagen no encontrada', 404);

  const updateData: Record<string, unknown> = {};
  if (data.image_url !== undefined) updateData.image_url = data.image_url;
  if (data.caption !== undefined) updateData.caption = data.caption;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

  return prisma.gpsGalleryImage.update({ where: { id }, data: updateData, select: gallerySelect });
}

/** Eliminar imagen */
export async function remove(id: string) {
  const existing = await prisma.gpsGalleryImage.findUnique({ where: { id } });
  if (!existing) throw new AppError('Imagen no encontrada', 404);
  await prisma.gpsGalleryImage.delete({ where: { id } });
  return { deleted: true };
}
