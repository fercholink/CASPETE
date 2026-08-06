import { z } from 'zod';

export const linkTrackerSchema = z.object({
  student_id: z.string().uuid(),
  imei: z.string().min(10).max(20),
  device_name: z.string().max(100).optional(),
});
export type LinkTrackerInput = z.infer<typeof linkTrackerSchema>;

export const historyQuerySchema = z.object({
  hours: z.coerce.number().int().positive().max(72).default(24),
  // Si se pasa, tiene prioridad sobre `hours` — historial de ese día calendario completo (hora Bogotá).
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
});

// El dispositivo llama a estos números al presionar su botón físico de SOS.
const contactNumberSchema = z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').nullable().optional();
export const emergencyContactsSchema = z.object({
  sos_number: contactNumberSchema,
  dad_number: contactNumberSchema,
  mom_number: contactNumberSchema,
});
export type EmergencyContactsInput = z.infer<typeof emergencyContactsSchema>;

export const findDeviceSchema = z.object({
  active: z.boolean(),
});
export type FindDeviceInput = z.infer<typeof findDeviceSchema>;
