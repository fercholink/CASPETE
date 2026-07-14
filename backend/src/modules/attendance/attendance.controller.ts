import type { Request, Response } from 'express';
import * as attendanceService from './attendance.service.js';
import { scanAttendanceSchema } from './attendance.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function scan(req: Request, res: Response) {
  const input = scanAttendanceSchema.parse(req.body);
  const result = await attendanceService.scanForAttendance(input, req.user!);
  sendSuccess(res, result, 'Asistencia registrada', 201);
}

export async function listForCourse(req: Request, res: Response) {
  const courseId = req.params['courseId'] as string;
  const result = await attendanceService.listAttendanceForCourse(courseId, req.user!);
  sendSuccess(res, result);
}
