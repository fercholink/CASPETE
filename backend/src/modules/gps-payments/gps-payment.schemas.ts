import { z } from 'zod';

export const createGpsPaymentSchema = z.object({
  trackerId: z.string().uuid(),
  type: z.enum(['DEVICE', 'MONTHLY_SUBSCRIPTION']),
  receiptUrl: z.string().min(1),
  paymentReference: z.string().max(100).optional(),
});
export type CreateGpsPaymentInput = z.infer<typeof createGpsPaymentSchema>;

export const processGpsPaymentSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});
export type ProcessGpsPaymentInput = z.infer<typeof processGpsPaymentSchema>;
