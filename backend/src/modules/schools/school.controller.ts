import type { Request, Response } from 'express';
import * as schoolService from './school.service.js';
import { createSchoolSchema, updateSchoolSchema } from './school.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function create(req: Request, res: Response) {
  const input = createSchoolSchema.parse(req.body);
  const school = await schoolService.createSchool(input);
  sendSuccess(res, school, 'Colegio creado exitosamente', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const result = await schoolService.listSchools(page, limit);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  if (req.user!.role === 'SCHOOL_ADMIN' && req.user!.schoolId !== id) {
    throw new AppError('No tienes permiso para ver este colegio', 403);
  }
  const school = await schoolService.getSchool(id);
  sendSuccess(res, school);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateSchoolSchema.parse(req.body);
  const school = await schoolService.updateSchool(id, input);
  sendSuccess(res, school, 'Colegio actualizado');
}

export async function listActive(_req: Request, res: Response) {
  const schools = await schoolService.listActiveSchools();
  sendSuccess(res, schools);
}

export async function deactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const school = await schoolService.deactivateSchool(id);
  sendSuccess(res, school, 'Colegio desactivado');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await schoolService.deleteSchool(id);
  sendSuccess(res, null, 'Colegio eliminado permanentemente');
}
