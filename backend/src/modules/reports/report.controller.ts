import type { Request, Response } from 'express';
import * as reportService from './report.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function summary(req: Request, res: Response) {
  const data = await reportService.getSummary(req.user!);
  sendSuccess(res, data);
}

export async function schoolSummary(req: Request, res: Response) {
  const data = await reportService.getSchoolSummary(req.user!);
  sendSuccess(res, data);
}

export async function globalStats(req: Request, res: Response) {
  const data = await reportService.getGlobalStats(req.user!);
  sendSuccess(res, data);
}

export async function schoolsRevenue(req: Request, res: Response) {
  const data = await reportService.getSchoolsRevenueReport(req.user!);
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

export async function pensionAudit(req: Request, res: Response) {
  const schoolId = (req.query['school_id'] as string) ?? req.user!.schoolId;
  if (!schoolId) throw new AppError('Falta school_id', 400);
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(req.query['month']) || now.getMonth() + 1));
  const year = Number(req.query['year']) || now.getFullYear();
  const data = await reportService.getPensionAuditReport(req.user!, schoolId, month, year);
  sendSuccess(res, data);
}
