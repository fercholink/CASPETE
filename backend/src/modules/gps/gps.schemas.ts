import { z } from 'zod';

export const linkTrackerSchema = z.object({
  student_id: z.string().uuid(),
  imei: z.string().min(10).max(20),
  device_name: z.string().max(100).optional(),
  phone_number: z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').optional(),
});
export type LinkTrackerInput = z.infer<typeof linkTrackerSchema>;

export const setPhoneNumberSchema = z.object({
  phone_number: z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').nullable(),
});
export type SetPhoneNumberInput = z.infer<typeof setPhoneNumberSchema>;

export const historyQuerySchema = z.object({
  hours: z.coerce.number().int().positive().max(72).default(24),
  // Si se pasa, tiene prioridad sobre `hours` — historial de ese día calendario completo (hora Bogotá).
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  // Filtra el día a solo el tramo de la mañana (antes del mediodía, hora Bogotá) o la tarde (desde el mediodía) —
  // útil para guardar el recorrido de ida y el de vuelta como rutas normales separadas.
  segment: z.enum(['morning', 'afternoon']).optional(),
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

export const powerActionSchema = z.object({
  action: z.enum(['restart', 'shutdown']),
});
export type PowerActionInput = z.infer<typeof powerActionSchema>;

const alarmEntrySchema = z.object({
  weekdays: z.coerce.number().int().min(0).max(127),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
});
export const setAlarmClockSchema = z.object({
  alarms: z.array(alarmEntrySchema).max(3),
});
export type SetAlarmClockInput = z.infer<typeof setAlarmClockSchema>;
