import { z } from 'zod';

export const CreateGpsDeviceOrderSchema = z.object({
  contact_name:      z.string().min(3).max(200).regex(/^[A-Za-zÀ-ÿ\s'.]+$/, 'El nombre debe contener solo letras y espacios'),
  contact_email:      z.string().email('El correo electrónico no es válido'),
  contact_phone:      z.string().min(7).max(20).regex(/^[0-9\s+-]+$/, 'El teléfono debe contener solo números y caracteres válidos'),
  city:               z.string().min(2).max(100).regex(/^[A-Za-zÀ-ÿ\s'-]+$/, 'La ciudad debe contener solo letras y espacios'),
  address:            z.string().min(5).max(300, 'La dirección no puede exceder los 300 caracteres'),
  student_name:       z.string().max(200).optional(),
  receipt_url:        z.string().min(1, 'Debes subir el comprobante de la transferencia'),
  payment_reference:  z.string().max(100).optional(),
  // ── Anti-spam (público, sin auth) — nunca los llena un usuario real ──────
  website:            z.string().max(200).optional(),  // honeypot
  form_loaded_at:     z.coerce.number().optional(),
});

export const UpdateGpsDeviceOrderSchema = z.object({
  status:          z.enum(['PENDING', 'PAID_CONFIRMED', 'SHIPPED', 'REJECTED']).optional(),
  imei:            z.string().min(10).max(20).optional(),
  tracking_number: z.string().max(100).optional(),
  notes:           z.string().max(2000).optional(),
});

export type CreateGpsDeviceOrderInput = z.infer<typeof CreateGpsDeviceOrderSchema>;
export type UpdateGpsDeviceOrderInput = z.infer<typeof UpdateGpsDeviceOrderSchema>;
