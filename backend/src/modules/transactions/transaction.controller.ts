import type { Request, Response } from 'express';
import * as txService from './transaction.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function list(req: Request, res: Response) {
  const studentId = req.query['student_id'] as string | undefined;
  if (!studentId) throw new AppError('student_id es requerido', 400);
  const data = await txService.listTransactions(studentId, req.user!);
  sendSuccess(res, data);
}
