import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import * as gpsPlatform from '../../lib/gpsPlatform.js';
import type { CreateGeofenceInput, UpdateGeofenceInput } from './gps-geofence.schemas.js';

/** Geocercas "libres" (no la automática 1:1 con un colegio) — SUPER_ADMIN, para zonas adicionales. */
export async function createGeofence(input: CreateGeofenceInput) {
  return gpsPlatform.createGeofence(input);
}

export async function listGeofences() {
  return gpsPlatform.listGeofences();
}

export async function updateGeofence(id: string, input: UpdateGeofenceInput) {
  return gpsPlatform.updateGeofenceMeta(id, input);
}

async function resolvePlatformTrackerId(trackerId: string): Promise<string> {
  const tracker = await prisma.gPSTracker.findUnique({ where: { id: trackerId }, select: { platform_tracker_id: true } });
  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (!tracker.platform_tracker_id) {
    throw new AppError('Este localizador todavía no está sincronizado con la Plataforma GPS', 409);
  }
  return tracker.platform_tracker_id;
}

export async function linkTracker(geofenceId: string, trackerId: string) {
  const platformTrackerId = await resolvePlatformTrackerId(trackerId);
  await gpsPlatform.linkTrackerToGeofence(geofenceId, platformTrackerId);
}

export async function unlinkTracker(geofenceId: string, trackerId: string) {
  const platformTrackerId = await resolvePlatformTrackerId(trackerId);
  await gpsPlatform.unlinkTrackerFromGeofence(geofenceId, platformTrackerId);
}
