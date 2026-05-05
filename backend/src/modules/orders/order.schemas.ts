import { z } from 'zod';

export const createOrderSchema = z.object({
  student_id: z.string().uuid(),
  store_id: z.string().uuid(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(date) >= today;
    }, 'La fecha del pedido no puede ser en el pasado'),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        customizations: z.array(z.string()).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const deliverOrderSchema = z.object({
  otp_code: z.string().length(4),
});

export const topupSchema = z.object({
  amount: z.number().positive(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
