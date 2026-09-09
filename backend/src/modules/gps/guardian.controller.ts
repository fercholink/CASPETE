import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as guardianService from './guardian.service.js';
import { EnrollGuardianSchema, UpdateGuardianSchema, CustomPlanSchema } from './guardian.schemas.js';

export async function getPlanSummary(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await guardianService.getStudentPlanSummary(studentId, req.user!);
  sendSuccess(res, result);
}

export async function listGuardians(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const result = await guardianService.listStudentGuardians(studentId, req.user!);
  sendSuccess(res, result);
}

export async function enrollGuardian(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const input = EnrollGuardianSchema.parse(req.body);
  const result = await guardianService.enrollGuardian(studentId, input, req.user!);
  sendSuccess(res, result, result.message, 201);
}

export async function resendInvitation(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const guardianId = req.params['guardianId'] as string;
  const result = await guardianService.resendGuardianInvitation(studentId, guardianId, req.user!);
  sendSuccess(res, result, result.message);
}

export async function updateGuardian(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const guardianId = req.params['guardianId'] as string;
  const input = UpdateGuardianSchema.parse(req.body);
  const result = await guardianService.updateGuardian(studentId, guardianId, input, req.user!);
  sendSuccess(res, result, 'Permisos del familiar actualizados');
}

export async function deleteGuardian(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const guardianId = req.params['guardianId'] as string;
  const result = await guardianService.deleteGuardian(studentId, guardianId, req.user!);
  sendSuccess(res, result, 'Familiar desvinculado del círculo de confianza');
}

export async function getMySharedStudents(req: Request, res: Response) {
  const result = await guardianService.getMySharedStudents(req.user!);
  sendSuccess(res, result);
}

export async function updateTrackerCustomPlan(req: Request, res: Response) {
  const trackerId = req.params['trackerId'] as string;
  const input = CustomPlanSchema.parse(req.body);
  const result = await guardianService.updateTrackerCustomPlan(trackerId, input, req.user!);
  sendSuccess(res, result, 'Plan personalizado actualizado');
}
