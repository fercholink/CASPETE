import type { Request, Response } from 'express';
import * as gpsService from './gps.service.js';
import {
  linkTrackerSchema, historyQuerySchema, emergencyContactsSchema, findDeviceSchema,
  powerActionSchema, setAlarmClockSchema, setPhoneNumberSchema,
} from './gps.schemas.js';
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

export async function setEmergencyContacts(req: Request, res: Response) {
  const input = emergencyContactsSchema.parse(req.body);
  const result = await gpsService.setEmergencyContacts(req.params['id'] as string, input, req.user!);
  sendSuccess(res, result, 'Números de contacto actualizados');
}

export async function setPhoneNumber(req: Request, res: Response) {
  const input = setPhoneNumberSchema.parse(req.body);
  const result = await gpsService.setPhoneNumber(req.params['id'] as string, input, req.user!);
  sendSuccess(res, result, 'Número de teléfono actualizado');
}

export async function findDevice(req: Request, res: Response) {
  const input = findDeviceSchema.parse(req.body);
  await gpsService.findDevice(req.params['id'] as string, input.active, req.user!);
  sendSuccess(res, null, input.active ? 'Buscando dispositivo' : 'Búsqueda detenida');
}

export async function sendPowerAction(req: Request, res: Response) {
  const input = powerActionSchema.parse(req.body);
  await gpsService.sendPowerAction(req.params['id'] as string, input.action, req.user!);
  sendSuccess(res, null, input.action === 'shutdown' ? 'Apagando dispositivo' : 'Reiniciando dispositivo');
}

export async function setAlarmClock(req: Request, res: Response) {
  const input = setAlarmClockSchema.parse(req.body);
  await gpsService.setAlarmClock(req.params['id'] as string, input.alarms, req.user!);
  sendSuccess(res, null, 'Alarma actualizada');
}

export async function getCurrentLocation(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await gpsService.getCurrentLocation(studentId, req.user!, req);
  sendSuccess(res, result);
}

export async function getHistory(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const { hours, date } = historyQuerySchema.parse(req.query);
  const result = await gpsService.getHistory(studentId, { hours, ...(date !== undefined && { date }) }, req.user!, req);
  sendSuccess(res, result);
}

export async function getExpectedRoute(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await gpsService.getExpectedRoute(studentId, req.user!);
  sendSuccess(res, result);
}

export async function saveRouteFromHistory(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const { hours, date } = historyQuerySchema.parse(req.query);
  const result = await gpsService.saveRouteFromHistory(studentId, { hours, ...(date !== undefined && { date }) }, req.user!);
  sendSuccess(res, result, 'Ruta normal guardada');
}
