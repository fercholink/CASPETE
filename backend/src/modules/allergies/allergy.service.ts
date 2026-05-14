import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

// ── Alergias maestras ────────────────────────────────────────────────────────

export async function listAllergies() {
  return prisma.allergy.findMany({ orderBy: { name: 'asc' } });
}

export async function createAllergy(data: { name: string; severity?: string; description?: string }, actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo el Super Administrador puede crear alergias', 403);
  return prisma.allergy.create({ data: { name: data.name, severity: data.severity ?? 'moderate', description: data.description ?? null } });
}

// ── Alergias por Estudiante ───────────────────────────────────────────────────

export async function getStudentAllergies(studentId: string) {
  return prisma.studentAllergy.findMany({
    where: { student_id: studentId },
    include: { allergy: true },
    orderBy: { allergy: { name: 'asc' } },
  });
}

export async function setStudentAllergies(studentId: string, allergyIds: string[], actor: JwtPayload) {
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT'].includes(actor.role)) throw new AppError('No autorizado', 403);

  // PARENT solo puede editar sus propios hijos
  if (actor.role === 'PARENT') {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { parent_id: true } });
    if (!student || student.parent_id !== actor.sub) throw new AppError('No autorizado', 403);
  }

  // Reemplazar alergias (delete + create)
  await prisma.$transaction([
    prisma.studentAllergy.deleteMany({ where: { student_id: studentId } }),
    ...(allergyIds.length > 0
      ? [prisma.studentAllergy.createMany({ data: allergyIds.map(id => ({ student_id: studentId, allergy_id: id })) })]
      : []),
  ]);

  return getStudentAllergies(studentId);
}

// ── Alergias por Producto ─────────────────────────────────────────────────────

export async function getProductAllergens(productId: string) {
  return prisma.productAllergy.findMany({
    where: { product_id: productId },
    include: { allergy: true },
  });
}

export async function setProductAllergens(productId: string, allergyIds: string[], actor: JwtPayload) {
  if (actor.role !== 'SUPER_ADMIN') throw new AppError('Solo el Super Administrador puede editar alérgenos de productos', 403);

  await prisma.$transaction([
    prisma.productAllergy.deleteMany({ where: { product_id: productId } }),
    ...(allergyIds.length > 0
      ? [prisma.productAllergy.createMany({ data: allergyIds.map(id => ({ product_id: productId, allergy_id: id })) })]
      : []),
  ]);

  return getProductAllergens(productId);
}

// ── Verificación de alerta en lonchera ────────────────────────────────────────

/**
 * Dados los IDs de storeProducts en el carrito y el ID del estudiante,
 * retorna los alérgenos del estudiante que están presentes en algún producto.
 */
export async function checkAllergenAlert(studentId: string, storeProductIds: string[]) {
  const [studentAllergies, productAllergens] = await Promise.all([
    prisma.studentAllergy.findMany({
      where: { student_id: studentId },
      select: { allergy_id: true, allergy: { select: { name: true, severity: true } } },
    }),
    prisma.productAllergy.findMany({
      where: { product: { store_products: { some: { id: { in: storeProductIds } } } } },
      select: {
        allergy_id: true,
        product: { select: { name: true, store_products: { where: { id: { in: storeProductIds } }, select: { id: true } } } },
      },
    }),
  ]);

  const studentAllergyIds = new Set(studentAllergies.map(a => a.allergy_id));
  const alerts = productAllergens
    .filter(pa => studentAllergyIds.has(pa.allergy_id))
    .map(pa => ({
      allergy: studentAllergies.find(sa => sa.allergy_id === pa.allergy_id)!.allergy,
      product: pa.product.name,
    }));

  return { has_alert: alerts.length > 0, alerts };
}
