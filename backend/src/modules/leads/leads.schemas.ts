import { z } from 'zod';

export const CreateLeadSchema = z.object({
  school_name:    z.string().min(3).max(200),
  nit:            z.string().max(20).optional(),
  city:           z.string().min(2).max(100),
  contact_name:   z.string().min(3).max(200),
  contact_email:  z.string().email(),
  contact_phone:  z.string().max(20).optional(),
  students_count: z.number().int().positive().optional(),
  plan_interest:  z.enum(['COMMISSION', 'MONTHLY']),
  message:        z.string().max(1000).optional(),
});

export const UpdateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'DEMO', 'CLOSED']).optional(),
  notes:  z.string().max(2000).optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
