import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET debe tener al menos 32 caracteres'),
  PORT: z.coerce.number().default(3001),
  GPS_TCP_PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SENTRY_DSN: z.string().optional(),
  // Respaldo diario de la base de datos a S3 (opcional — sin esto, el job se omite)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BACKUP_BUCKET: z.string().optional(),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY es requerida'),
  EMAIL_FROM: z.string().default('info@caspete.com'),
  PAYMENT_EMAIL: z.string().default('pagos@caspete.com'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID es requerida'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET es requerida'),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3001/api/auth/google/callback'),
  // Nequi Push Payments (opcional — se activa al configurar)
  NEQUI_API_URL: z.string().default('https://api.sandbox.nequi.com'),
  NEQUI_CLIENT_ID: z.string().default(''),
  NEQUI_CLIENT_SECRET: z.string().default(''),
  NEQUI_API_KEY: z.string().default(''),
  NEQUI_CHANNEL: z.string().default('PNP04-C001'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
