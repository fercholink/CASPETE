import { z } from 'zod';

export const createStudentSchema = z.object({
  school_id: z.string().uuid(),
  full_name: z.string().min(2).max(200),
  national_id: z.string().max(20).optional(),
  grade: z.string().max(10).optional(),
});

export const updateStudentSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  national_id: z.string().max(20).optional(),
  grade: z.string().max(10).optional(),
  active: z.boolean().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
