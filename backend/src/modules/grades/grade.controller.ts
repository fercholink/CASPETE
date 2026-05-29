import type { Request, Response } from 'express';
import * as gradeService from './grade.service.js';
import { createGradeSchema, updateGradeSchema } from './grade.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createGradeSchema.parse(req.body);
  const grade = await gradeService.createGrade(input, req.user!);
  sendSuccess(res, grade, 'Calificación registrada con éxito', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const filters: any = { page, limit };

  if (typeof req.query['course_id'] === 'string') filters.course_id = req.query['course_id'];
  if (typeof req.query['student_id'] === 'string') filters.student_id = req.query['student_id'];

  const result = await gradeService.listGrades(req.user!, filters);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const grade = await gradeService.getGrade(id, req.user!);
  sendSuccess(res, grade);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateGradeSchema.parse(req.body);
  const grade = await gradeService.updateGrade(id, input, req.user!);
  sendSuccess(res, grade, 'Calificación actualizada con éxito');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await gradeService.deleteGrade(id, req.user!);
  sendSuccess(res, null, 'Calificación eliminada con éxito');
}
