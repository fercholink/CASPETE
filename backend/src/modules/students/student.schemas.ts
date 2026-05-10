import { z } from 'zod';

export const createStudentSchema = z.object({
  school_id: z.string().uuid(),
  full_name: z.string().min(2).max(200),
  national_id: z.string().max(20).optional(),
  grade: z.string().max(10).optional(),
  photo_url: z.string().optional(),
});

export const updateStudentSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  school_id: z.string().uuid().optional(),
  national_id: z.string().max(20).optional(),
  grade: z.string().max(10).optional(),
  photo_url: z.string().optional(),
  active: z.boolean().optional(),
  delivery_code: z.string().length(6, 'El código debe ser de 6 caracteres').optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
