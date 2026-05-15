import { z } from 'zod';

export const CreateThreadSchema = z.object({
  order_id: z.string().uuid().optional(),
  parent_id: z.string().uuid(),
  subject: z.string().min(3).max(200),
  first_message: z.string().min(1).max(1000),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const CloseThreadSchema = z.object({
  status: z.enum(['CLOSED', 'RESOLVED']),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type SendMessageInput  = z.infer<typeof SendMessageSchema>;
export type CloseThreadInput  = z.infer<typeof CloseThreadSchema>;
