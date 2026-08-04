import { z } from 'zod';

export const generateChargesSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato YYYY-MM requerido'),
});

export type GenerateChargesInput = z.infer<typeof generateChargesSchema>;
