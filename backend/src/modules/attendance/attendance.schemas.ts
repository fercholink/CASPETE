import { z } from 'zod';

export const scanAttendanceSchema = z.object({
  qr_token: z.string().min(10).max(64),
  course_id: z.string().uuid(),
});
export type ScanAttendanceInput = z.infer<typeof scanAttendanceSchema>;
