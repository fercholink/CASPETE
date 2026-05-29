import { z } from 'zod';

export const createCommunicationSchema = z.object({
  receiver_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  attachment_url: z.string().url('URL de archivo adjunto inválida').or(z.string().regex(/^data:image\/[a-zA-Z]+;base64,/, 'Formato base64 inválido')).or(z.string().length(0)).optional().nullable(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;
