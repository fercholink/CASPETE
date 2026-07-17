import type { Request, Response } from 'express';
import * as menuService from './menu.service.js';
import { upsertMenuDaySchema } from './menu.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

function assertSchoolAccess(req: Request, schoolId: string) {
  if (req.user!.role !== 'SUPER_ADMIN' && req.user!.schoolId !== schoolId) {
    throw new AppError('No tienes permiso para el menú de este colegio', 403);
  }
}

export async function upsertDay(req: Request, res: Response) {
  const schoolId = req.params['schoolId'] as string;
  const date = req.params['date'] as string;
  assertSchoolAccess(req, schoolId);
  const input = upsertMenuDaySchema.parse(req.body);
  const day = await menuService.upsertMenuDay(schoolId, date, input);
  sendSuccess(res, day, 'Menú del día guardado');
}

export async function listMonth(req: Request, res: Response) {
  const schoolId = req.params['schoolId'] as string;
  assertSchoolAccess(req, schoolId);
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(req.query['month']) || now.getMonth() + 1));
  const year = Number(req.query['year']) || now.getFullYear();
  const days = await menuService.listMonth(schoolId, month, year);
  sendSuccess(res, days);
}

export async function deleteDay(req: Request, res: Response) {
  const schoolId = req.params['schoolId'] as string;
  const date = req.params['date'] as string;
  assertSchoolAccess(req, schoolId);
  await menuService.deleteMenuDay(schoolId, date);
  sendSuccess(res, null, 'Menú del día eliminado');
}
