import { z } from 'zod';

export const upsertMenuDaySchema = z.object({
  soup: z.string().max(200).nullable().default(null),
  main_protein: z.string().min(1).max(200),
  optional_protein: z.string().max(200).nullable().default(null),
  energetic: z.string().max(200).nullable().default(null),
  dessert: z.string().max(200).nullable().default(null),
  vegetarian_available: z.boolean().default(false),
  allergy_ids: z.array(z.string().uuid()).optional(),
});

export type UpsertMenuDayInput = z.infer<typeof upsertMenuDaySchema>;
