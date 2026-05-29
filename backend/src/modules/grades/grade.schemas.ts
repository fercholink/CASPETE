import { z } from 'zod';

export const createGradeSchema = z.object({
  course_id: z.string().uuid(),
  student_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  evaluation_name: z.string().min(1).max(100),
  comments: z.string().optional(),
});

export const updateGradeSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  evaluation_name: z.string().min(1).max(100).optional(),
  comments: z.string().optional(),
});

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
