/**
 * Sincroniza el trayecto esperado (casa↔colegio) de un estudiante con la
 * Plataforma GPS — "georuta". Se llama tanto al guardar la ubicación de casa
 * del estudiante como al vincular su tarjeta GPS, ya que cualquiera de los
 * dos puede llegar primero. Best-effort: nunca debe romper el flujo que lo
 * dispara (guardar estudiante / vincular tarjeta) si la Plataforma GPS falla.
 */
import { prisma } from './prisma.js';
import * as gpsPlatform from './gpsPlatform.js';

// Más ancho que la geocerca del colegio — la ruta sigue calles, no una
// línea recta perfecta, así que necesita margen para no marcar "desviado"
// por el trazado normal de la vía.
const ROUTE_CORRIDOR_METERS = 300;

export async function syncStudentRoute(studentId: string): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        full_name: true,
        home_latitude: true,
        home_longitude: true,
        school: { select: { latitude: true, longitude: true } },
        gps_tracker: { select: { id: true, platform_tracker_id: true, platform_route_id: true } },
      },
    });
    if (!student?.gps_tracker?.platform_tracker_id) return;
    if (student.home_latitude === null || student.home_longitude === null) return;
    if (student.school.latitude === null || student.school.longitude === null) return;

    const points = [
      { lat: student.home_latitude.toNumber(), lon: student.home_longitude.toNumber() },
      { lat: student.school.latitude.toNumber(), lon: student.school.longitude.toNumber() },
    ];

    const route = await gpsPlatform.upsertRoute(
      student.gps_tracker.platform_route_id,
      `Casa-colegio: ${student.full_name}`,
      points,
      ROUTE_CORRIDOR_METERS,
    );

    if (route.id !== student.gps_tracker.platform_route_id) {
      await prisma.gPSTracker.update({
        where: { id: student.gps_tracker.id },
        data: { platform_route_id: route.id },
      });
    }

    await gpsPlatform.linkTrackerToRoute(route.id, student.gps_tracker.platform_tracker_id);
  } catch (err) {
    console.error('[RouteSync] No se pudo sincronizar la georuta:', err);
  }
}
