import { z } from 'zod';

export const createCourseSchema = z.object({
  school_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  academic_period: z.string().min(1).max(50).optional(),
});

export const updateCourseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  teacher_id: z.string().uuid().optional(),
  academic_period: z.string().min(1).max(50).optional(),
  student_ids: z.array(z.string().uuid()).optional(),
});

export const syncStudentsSchema = z.object({
  student_ids: z.array(z.string().uuid()),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type SyncStudentsInput = z.infer<typeof syncStudentsSchema>;
