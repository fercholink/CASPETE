import type { Request, Response } from 'express';
import * as gpsService from './gps.service.js';
import { linkTrackerSchema, historyQuerySchema } from './gps.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function link(req: Request, res: Response) {
  const input = linkTrackerSchema.parse(req.body);
  const tracker = await gpsService.linkTracker(input, req.user!);
  sendSuccess(res, tracker, 'Localizador vinculado', 201);
}

export async function unlink(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await gpsService.unlinkTracker(id, req.user!);
  sendSuccess(res, null, 'Localizador desvinculado');
}

export async function getCurrentLocation(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await gpsService.getCurrentLocation(studentId, req.user!, req);
  sendSuccess(res, result);
}

export async function getHistory(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const { hours } = historyQuerySchema.parse(req.query);
  const result = await gpsService.getHistory(studentId, hours, req.user!, req);
  sendSuccess(res, result);
}
