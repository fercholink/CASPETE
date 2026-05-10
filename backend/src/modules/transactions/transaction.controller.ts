import type { Request, Response } from 'express';
import * as txService from './transaction.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function list(req: Request, res: Response) {
  const studentId = req.query['student_id'] as string | undefined;
  if (!studentId) throw new AppError('student_id es requerido', 400);
  const page = Number(req.query['page']) || 1;
  const limit = Number(req.query['limit']) || 30;
  const opts: { page: number; limit: number; type?: string } = { page, limit };
  if (typeof req.query['type'] === 'string') opts.type = req.query['type'];
  const data = await txService.listTransactions(studentId, req.user!, opts);
  sendSuccess(res, data);
}

export async function getStats(req: Request, res: Response) {
  const studentId = req.query['student_id'] as string | undefined;
  if (!studentId) throw new AppError('student_id es requerido', 400);
  const stats = await txService.getTransactionStats(studentId, req.user!);
  sendSuccess(res, stats);
}
