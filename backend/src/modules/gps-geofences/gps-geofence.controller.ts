import type { Request, Response } from 'express';
import * as geofenceService from './gps-geofence.service.js';
import { createGeofenceSchema, updateGeofenceSchema, linkTrackerSchema } from './gps-geofence.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createGeofenceSchema.parse(req.body);
  const geofence = await geofenceService.createGeofence(input);
  sendSuccess(res, geofence, 'Geocerca creada', 201);
}

export async function list(_req: Request, res: Response) {
  const geofences = await geofenceService.listGeofences();
  sendSuccess(res, geofences);
}

export async function update(req: Request, res: Response) {
  const input = updateGeofenceSchema.parse(req.body);
  const geofence = await geofenceService.updateGeofence(req.params['id'] as string, input);
  sendSuccess(res, geofence, 'Geocerca actualizada');
}

export async function linkTracker(req: Request, res: Response) {
  const input = linkTrackerSchema.parse(req.body);
  await geofenceService.linkTracker(req.params['id'] as string, input.tracker_id);
  sendSuccess(res, null, 'Localizador vinculado a la geocerca', 201);
}

export async function unlinkTracker(req: Request, res: Response) {
  await geofenceService.unlinkTracker(req.params['id'] as string, req.params['trackerId'] as string);
  sendSuccess(res, null, 'Localizador desvinculado de la geocerca');
}
