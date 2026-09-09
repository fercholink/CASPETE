import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const prismaMock = {
  systemSetting: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));

const {
  getGpsGlobalPricing,
  updateGpsGlobalPricing,
} = await import('./gps-pricing.service.js');

const SUPER_ADMIN: JwtPayload = { sub: 'admin-1', role: 'SUPER_ADMIN', schoolId: null } as JwtPayload;
const PARENT: JwtPayload = { sub: 'parent-1', role: 'PARENT', schoolId: null } as JwtPayload;

describe('gps-pricing.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGpsGlobalPricing', () => {
    it('retorna precios por defecto si la base de datos no tiene registros', async () => {
      prismaMock.systemSetting.findMany.mockResolvedValue([]);

      const pricing = await getGpsGlobalPricing();
      expect(pricing).toEqual({
        device_price: 120000,
        monthly_price: 30000,
        extra_guardian_price: 5000,
        included_guardians: 1,
        max_emergency_numbers: 3,
      });
    });

    it('retorna precios personalizados de SystemSetting cuando existen', async () => {
      prismaMock.systemSetting.findMany.mockResolvedValue([
        { key: 'gps_device_price', value: '150000' },
        { key: 'gps_monthly_price', value: '35000' },
        { key: 'gps_extra_guardian_price', value: '7000' },
        { key: 'gps_included_guardians', value: '2' },
        { key: 'gps_max_emergency_numbers', value: '5' },
      ]);

      // Forzar invalidación de caché llamando a update o esperando
      const updated = await updateGpsGlobalPricing(
        {
          device_price: 150000,
          monthly_price: 35000,
          extra_guardian_price: 7000,
          included_guardians: 2,
          max_emergency_numbers: 5,
        },
        SUPER_ADMIN,
      );

      expect(updated.device_price).toBe(150000);
      expect(updated.monthly_price).toBe(35000);
      expect(updated.extra_guardian_price).toBe(7000);
      expect(updated.included_guardians).toBe(2);
      expect(updated.max_emergency_numbers).toBe(5);
    });
  });

  describe('updateGpsGlobalPricing', () => {
    it('bloquea con error 403 si un usuario sin rol SUPER_ADMIN intenta modificar tarifas', async () => {
      await expect(
        updateGpsGlobalPricing(
          {
            device_price: 100000,
            monthly_price: 25000,
            extra_guardian_price: 4000,
            included_guardians: 1,
            max_emergency_numbers: 3,
          },
          PARENT,
        ),
      ).rejects.toThrow('Solo la cuenta Master');
    });

    it('permite a SUPER_ADMIN actualizar los precios y hace upsert en la base de datos', async () => {
      prismaMock.systemSetting.upsert.mockResolvedValue({});

      const result = await updateGpsGlobalPricing(
        {
          device_price: 130000,
          monthly_price: 32000,
          extra_guardian_price: 6000,
          included_guardians: 1,
          max_emergency_numbers: 4,
        },
        SUPER_ADMIN,
      );

      expect(result.device_price).toBe(130000);
      expect(result.monthly_price).toBe(32000);
      expect(result.extra_guardian_price).toBe(6000);
      expect(prismaMock.systemSetting.upsert).toHaveBeenCalledTimes(5);
    });
  });
});
