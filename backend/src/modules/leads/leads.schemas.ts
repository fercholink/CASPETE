import { z } from 'zod';

export const CreateLeadSchema = z.object({
  school_name:    z.string().min(3).max(200).regex(/^[A-Za-z0-9À-ÿ\s.,#&'-]+$/, 'El nombre del colegio contiene caracteres no válidos'),
  nit:            z.string().max(20).regex(/^[0-9.-]*$/, 'El NIT debe contener solo números, puntos o guiones').optional(),
  city:           z.string().min(2).max(100).regex(/^[A-Za-zÀ-ÿ\s'-]+$/, 'La ciudad debe contener solo letras y espacios'),
  contact_name:   z.string().min(3).max(200).regex(/^[A-Za-zÀ-ÿ\s'.]+$/, 'El nombre debe contener solo letras y espacios'),
  contact_email:  z.string().email('El correo electrónico no es válido'),
  contact_phone:  z.string().max(20).regex(/^[0-9\s+-]*$/, 'El teléfono debe contener solo números y caracteres válidos').optional(),
  students_count: z.number().int().positive('El número de estudiantes debe ser un número positivo').optional(),
  plan_interest:  z.enum(['COMMISSION', 'MONTHLY']),
  message:        z.string().max(200, 'Las observaciones no pueden exceder los 200 caracteres').optional(),
});

export const AdminCreateLeadSchema = CreateLeadSchema.extend({
  status: z.enum(['NEW', 'CONTACTED', 'DEMO', 'CLOSED']).optional(),
});

export const UpdateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'DEMO', 'CLOSED']).optional(),
  notes:  z.string().max(2000).optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type AdminCreateLeadInput = z.infer<typeof AdminCreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
