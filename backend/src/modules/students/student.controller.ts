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
  const students = await studentService.listStudents(req.user!);
  sendSuccess(res, students);
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

export async function topup(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = topupSchema.parse(req.body);
  const student = await topupStudent(id, input, req.user!);
  sendSuccess(res, student, 'Saldo recargado');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await studentService.deleteStudent(id, req.user!);
  sendSuccess(res, null, 'Estudiante eliminado permanentemente');
}
