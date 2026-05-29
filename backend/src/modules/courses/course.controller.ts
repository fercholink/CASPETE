import type { Request, Response } from 'express';
import * as courseService from './course.service.js';
import { createCourseSchema, updateCourseSchema, syncStudentsSchema } from './course.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createCourseSchema.parse(req.body);
  const course = await courseService.createCourse(input, req.user!);
  sendSuccess(res, course, 'Curso creado con éxito', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const filters: any = { page, limit };

  if (typeof req.query['search'] === 'string') filters.search = req.query['search'];
  if (typeof req.query['teacher_id'] === 'string') filters.teacher_id = req.query['teacher_id'];
  if (typeof req.query['student_id'] === 'string') filters.student_id = req.query['student_id'];

  const result = await courseService.listCourses(req.user!, filters);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const course = await courseService.getCourse(id, req.user!);
  sendSuccess(res, course);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateCourseSchema.parse(req.body);
  const course = await courseService.updateCourse(id, input, req.user!);
  sendSuccess(res, course, 'Curso actualizado con éxito');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await courseService.deleteCourse(id, req.user!);
  sendSuccess(res, null, 'Curso eliminado con éxito');
}

export async function syncStudents(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const { student_ids } = syncStudentsSchema.parse(req.body);
  const result = await courseService.syncStudents(id, student_ids, req.user!);
  sendSuccess(res, result, 'Matrícula sincronizada con éxito');
}
