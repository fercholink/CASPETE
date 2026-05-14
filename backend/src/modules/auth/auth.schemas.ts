import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos')
    .optional(),
  country_code: z.string().optional(),
  role: z.enum(['PARENT']),
  school_id: z.string().uuid('school_id debe ser un UUID válido').optional(),
  // ── Ley 1581/2012 — Consentimientos obligatorios (Art. 7, 9, 12) ──
  consent_general:   z.literal(true, { message: 'Debe aceptar la política general de tratamiento de datos' }),
  consent_sensitive: z.literal(true, { message: 'Debe autorizar el tratamiento de datos sensibles de salud' }),
  consent_legal_rep: z.literal(true, { message: 'Debe declarar ser el representante legal del menor' }),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos').optional().nullable(),
  country_code: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token es requerido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
