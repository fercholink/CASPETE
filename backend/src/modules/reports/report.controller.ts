import type { Request, Response } from 'express';
import * as reportService from './report.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function summary(req: Request, res: Response) {
  const data = await reportService.getSummary(req.user!);
  sendSuccess(res, data);
}

export async function globalStats(req: Request, res: Response) {
  const data = await reportService.getGlobalStats(req.user!);
  sendSuccess(res, data);
}

export async function parentSummary(req: Request, res: Response) {
  const data = await reportService.getParentSummary(req.user!);
  sendSuccess(res, data);
}

export async function vendorSummary(req: Request, res: Response) {
  const data = await reportService.getVendorSummary(req.user!);
  sendSuccess(res, data);
}
