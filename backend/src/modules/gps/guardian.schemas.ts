import { z } from 'zod';

export const GuardianRelationshipEnum = z.enum([
  'MOTHER',
  'FATHER',
  'GRANDPARENT',
  'UNCLE_AUNT',
  'LEGAL_TUTOR',
  'FAMILY_OTHER',
]);

export const EnrollGuardianSchema = z.object({
  email: z.string().email('El correo electrónico no es válido').trim().toLowerCase(),
  relationship: GuardianRelationshipEnum.default('FAMILY_OTHER'),
  can_view_live: z.boolean().default(true),
  can_view_history: z.boolean().default(true),
  can_receive_alerts: z.boolean().default(true),
  can_view_meals: z.boolean().default(false),
});

export const UpdateGuardianSchema = z.object({
  relationship: GuardianRelationshipEnum.optional(),
  can_view_live: z.boolean().optional(),
  can_view_history: z.boolean().optional(),
  can_receive_alerts: z.boolean().optional(),
  can_view_meals: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const CustomPlanSchema = z.object({
  included_guardians: z.number().int().min(0).max(10).optional(),
  custom_monthly_price: z.number().min(0).nullable().optional(),
  custom_guardian_price: z.number().min(0).nullable().optional(),
  max_emergency_numbers: z.number().int().min(1).max(5).optional(),
});

export type EnrollGuardianInput = z.infer<typeof EnrollGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof UpdateGuardianSchema>;
export type CustomPlanInput = z.infer<typeof CustomPlanSchema>;
