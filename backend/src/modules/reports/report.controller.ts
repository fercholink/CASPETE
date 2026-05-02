import type { Request, Response } from 'express';
import { getSummary } from './report.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function summary(req: Request, res: Response) {
  const data = await getSummary(req.user!);
  sendSuccess(res, data);
}
