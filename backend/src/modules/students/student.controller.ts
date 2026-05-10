import type { Request, Response } from 'express';
import * as studentService from './student.service.js';
import { topupStudent } from '../orders/order.service.js';
import { createStudentSchema, updateStudentSchema } from './student.schemas.js';
import { topupSchema } from '../orders/order.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createStudentSchema.parse(req.body);
  const student = await studentService.createStudent(input, req.user!);
  sendSuccess(res, student, 'Estudiante registrado', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const opts: { page: number; limit: number; search?: string; school_id?: string; grade?: string; active?: string } = { page, limit };
  if (typeof req.query['search'] === 'string') opts.search = req.query['search'];
  if (typeof req.query['school_id'] === 'string') opts.school_id = req.query['school_id'];
  if (typeof req.query['grade'] === 'string') opts.grade = req.query['grade'];
  if (typeof req.query['active'] === 'string') opts.active = req.query['active'];
  const result = await studentService.listStudents(req.user!, opts);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const student = await studentService.getStudent(id, req.user!);
  sendSuccess(res, student);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateStudentSchema.parse(req.body);
  const student = await studentService.updateStudent(id, input, req.user!);
  sendSuccess(res, student, 'Estudiante actualizado');
}

export async function deactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const student = await studentService.deactivateStudent(id, req.user!);
  sendSuccess(res, student, 'Estudiante desactivado');
}

export async function reactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const student = await studentService.reactivateStudent(id, req.user!);
  sendSuccess(res, student, 'Estudiante reactivado');
}

export async function topup(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = topupSchema.parse(req.body);
  const student = await topupStudent(id, input, req.user!);
  sendSuccess(res, student, 'Saldo recargado');
}

export async function getStats(req: Request, res: Response) {
  const stats = await studentService.getStudentStats(req.user!);
  sendSuccess(res, stats);
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await studentService.deleteStudent(id, req.user!);
  sendSuccess(res, null, 'Estudiante eliminado permanentemente');
}
