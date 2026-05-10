import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  full_name: z.string().min(2).max(200),
  phone: z.string().regex(/^\+57[0-9]{10}$/, 'Formato: +57XXXXXXXXXX').optional(),
  role: z.enum(['VENDOR', 'SCHOOL_ADMIN']),
  school_id: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['VENDOR', 'SCHOOL_ADMIN']).optional(),
  active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
