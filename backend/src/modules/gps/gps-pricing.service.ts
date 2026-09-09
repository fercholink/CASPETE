import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

export const UpdateGpsPricingSchema = z.object({
  device_price: z.number().min(0, 'El precio del dispositivo no puede ser negativo'),
  monthly_price: z.number().min(0, 'La mensualidad no puede ser negativa'),
  extra_guardian_price: z.number().min(0, 'El precio por familiar adicional no puede ser negativo'),
  included_guardians: z.number().int().min(1, 'Debe incluir al menos 1 familiar'),
  max_emergency_numbers: z.number().int().min(1, 'Debe permitir al menos 1 número de emergencia'),
});

export type UpdateGpsPricingInput = z.infer<typeof UpdateGpsPricingSchema>;

export interface GpsGlobalPricing {
  device_price: number;
  monthly_price: number;
  extra_guardian_price: number;
  included_guardians: number;
  max_emergency_numbers: number;
}

const DEFAULT_PRICING: GpsGlobalPricing = {
  device_price: 120000,
  monthly_price: 30000,
  extra_guardian_price: 5000,
  included_guardians: 1,
  max_emergency_numbers: 3,
};

let tableEnsured = false;
export async function ensureSystemSettingTableExists() {
  if (tableEnsured) return;
  if (typeof (prisma as any).$executeRawUnsafe !== 'function') return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
          "key" VARCHAR(100) NOT NULL,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
      );
    `);
    tableEnsured = true;
  } catch (err) {
    console.error('[SystemSetting DDL auto-healing]:', err);
  }
}

let cache: { data: GpsGlobalPricing; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minuto

export async function getGpsGlobalPricing(): Promise<GpsGlobalPricing> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  await ensureSystemSettingTableExists();

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'gps_device_price',
            'gps_monthly_price',
            'gps_extra_guardian_price',
            'gps_included_guardians',
            'gps_max_emergency_numbers',
          ],
        },
      },
    });

    const map = new Map<string, string>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    const pricing: GpsGlobalPricing = {
      device_price: map.has('gps_device_price') ? Number(map.get('gps_device_price')) : DEFAULT_PRICING.device_price,
      monthly_price: map.has('gps_monthly_price') ? Number(map.get('gps_monthly_price')) : DEFAULT_PRICING.monthly_price,
      extra_guardian_price: map.has('gps_extra_guardian_price') ? Number(map.get('gps_extra_guardian_price')) : DEFAULT_PRICING.extra_guardian_price,
      included_guardians: map.has('gps_included_guardians') ? Number(map.get('gps_included_guardians')) : DEFAULT_PRICING.included_guardians,
      max_emergency_numbers: map.has('gps_max_emergency_numbers') ? Number(map.get('gps_max_emergency_numbers')) : DEFAULT_PRICING.max_emergency_numbers,
    };

    cache = { data: pricing, expiresAt: now + CACHE_TTL_MS };
    return pricing;
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function updateGpsGlobalPricing(
  input: UpdateGpsPricingInput,
  actor: JwtPayload,
): Promise<GpsGlobalPricing> {
  if (actor.role !== 'SUPER_ADMIN') {
    throw new AppError('Solo la cuenta Master (Super Administrador) puede modificar las tarifas globales', 403);
  }

  await ensureSystemSettingTableExists();

  const entries: Array<{ key: string; value: string; description: string }> = [
    {
      key: 'gps_device_price',
      value: String(Math.round(input.device_price)),
      description: 'Precio de compra única del dispositivo localizador GPS en COP',
    },
    {
      key: 'gps_monthly_price',
      value: String(Math.round(input.monthly_price)),
      description: 'Precio de suscripción mensual base GPS en COP (llamadas a 3 números + 1 familiar incluido)',
    },
    {
      key: 'gps_extra_guardian_price',
      value: String(Math.round(input.extra_guardian_price)),
      description: 'Tarifa mensual por familiar adicional a partir del segundo en COP',
    },
    {
      key: 'gps_included_guardians',
      value: String(Math.round(input.included_guardians)),
      description: 'Número de familiares incluidos sin costo adicional en el plan base',
    },
    {
      key: 'gps_max_emergency_numbers',
      value: String(Math.round(input.max_emergency_numbers)),
      description: 'Cantidad máxima de números autorizados para llamadas en el localizador',
    },
  ];

  for (const entry of entries) {
    await prisma.systemSetting.upsert({
      where: { key: entry.key },
      update: { value: entry.value, description: entry.description },
      create: entry,
    });
  }

  // Invalidar caché
  const updated: GpsGlobalPricing = {
    device_price: Math.round(input.device_price),
    monthly_price: Math.round(input.monthly_price),
    extra_guardian_price: Math.round(input.extra_guardian_price),
    included_guardians: Math.round(input.included_guardians),
    max_emergency_numbers: Math.round(input.max_emergency_numbers),
  };
  cache = { data: updated, expiresAt: Date.now() + CACHE_TTL_MS };

  return updated;
}
