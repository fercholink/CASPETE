import type { Request, Response } from 'express';
import * as gpsService from './gps.service.js';
import {
  linkTrackerSchema, historyQuerySchema, emergencyContactsSchema, findDeviceSchema,
  powerActionSchema, setAlarmClockSchema, setPhoneNumberSchema,
  setLbsEnabledSchema, setSpeedThresholdSchema, setVibrationAlarmSchema,
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

export async function requestPosition(req: Request, res: Response) {
  const result = await gpsService.requestPosition(req.params['id'] as string, req.user!);
  sendSuccess(res, result, 'Posición solicitada');
}

export async function setLbsEnabled(req: Request, res: Response) {
  const input = setLbsEnabledSchema.parse(req.body);
  const result = await gpsService.setLbsEnabled(req.params['id'] as string, input.enabled, req.user!);
  sendSuccess(res, result, 'Posicionamiento LBS actualizado');
}

export async function setSpeedThreshold(req: Request, res: Response) {
  const input = setSpeedThresholdSchema.parse(req.body);
  const result = await gpsService.setSpeedThreshold(req.params['id'] as string, input.speed_kmh, req.user!);
  sendSuccess(res, result, 'Umbral de sobrevelocidad actualizado');
}

export async function setVibrationAlarm(req: Request, res: Response) {
  const input = setVibrationAlarmSchema.parse(req.body);
  const result = await gpsService.setVibrationAlarm(req.params['id'] as string, input.enabled, req.user!);
  sendSuccess(res, result, 'Alarma de vibración actualizada');
}

export async function getCurrentLocation(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await gpsService.getCurrentLocation(studentId, req.user!, req);
  sendSuccess(res, result);
}

export async function getHistory(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const { hours, date, segment } = historyQuerySchema.parse(req.query);
  const result = await gpsService.getHistory(
    studentId,
    { hours, ...(date !== undefined && { date }), ...(segment !== undefined && { segment }) },
    req.user!,
    req,
  );
  sendSuccess(res, result);
}

export async function getExpectedRoute(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await gpsService.getExpectedRoute(studentId, req.user!);
  sendSuccess(res, result);
}

export async function saveRouteFromHistory(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const { hours, date, segment } = historyQuerySchema.parse(req.query);
  const result = await gpsService.saveRouteFromHistory(
    studentId,
    { hours, ...(date !== undefined && { date }), ...(segment !== undefined && { segment }) },
    req.user!,
  );
  sendSuccess(res, result, 'Ruta normal guardada');
}
