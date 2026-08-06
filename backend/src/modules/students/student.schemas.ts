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
  daily_spending_limit: z.number().min(0, 'El límite no puede ser negativo').max(1000000, 'Límite máximo: $1.000.000').optional(),
  home_latitude: z.coerce.number().min(-90).max(90).optional(),
  home_longitude: z.coerce.number().min(-180).max(180).optional(),
  route_morning_pickup: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').nullable().optional(),
  route_morning_arrival: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').nullable().optional(),
  route_afternoon_pickup: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').nullable().optional(),
  route_afternoon_arrival: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').nullable().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
