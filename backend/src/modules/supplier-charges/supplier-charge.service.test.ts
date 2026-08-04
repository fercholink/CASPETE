import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

function decimal(n: number) {
  return { toNumber: () => n, toString: () => String(n) } as unknown as { toNumber: () => number; toString: () => string };
}

const prismaMock = {
  supplier: { findMany: vi.fn() },
  supplierCharge: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    aggregate: vi.fn(),
  },
};

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));

const { generateMonthlyCharges, listCharges, markChargePaid, cancelCharge } = await import('./supplier-charge.service.js');

const SUPER_ADMIN: JwtPayload = { sub: 'admin-1', role: 'SUPER_ADMIN', schoolId: null } as JwtPayload;
const SCHOOL_ADMIN: JwtPayload = { sub: 'school-admin-1', role: 'SCHOOL_ADMIN', schoolId: 'school-1' } as JwtPayload;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateMonthlyCharges', () => {
  it('rechaza si el actor no es SUPER_ADMIN', async () => {
    await expect(generateMonthlyCharges('2026-08', SCHOOL_ADMIN)).rejects.toThrow('No autorizado');
  });

  it('no crea nada si no hay proveedores elegibles (activos, con tarifa > 0 y producto activo)', async () => {
    prismaMock.supplier.findMany.mockResolvedValue([]);
    const result = await generateMonthlyCharges('2026-08', SUPER_ADMIN);
    expect(result).toEqual({ created: 0, skipped: 0, total: 0 });
    expect(prismaMock.supplierCharge.createMany).not.toHaveBeenCalled();
  });

  it('filtra proveedores por activos, listing_fee_monthly > 0 y al menos un producto activo', async () => {
    prismaMock.supplier.findMany.mockResolvedValue([{ id: 's-1', listing_fee_monthly: decimal(50000) }]);
    prismaMock.supplierCharge.createMany.mockResolvedValue({ count: 1 });

    await generateMonthlyCharges('2026-08', SUPER_ADMIN);

    expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, listing_fee_monthly: { gt: 0 }, products: { some: { active: true } } },
      }),
    );
  });

  it('crea un SupplierCharge por proveedor elegible con el monto de su tarifa', async () => {
    const fee1 = decimal(50000);
    const fee2 = decimal(30000);
    prismaMock.supplier.findMany.mockResolvedValue([
      { id: 's-1', listing_fee_monthly: fee1 },
      { id: 's-2', listing_fee_monthly: fee2 },
    ]);
    prismaMock.supplierCharge.createMany.mockResolvedValue({ count: 2 });

    const result = await generateMonthlyCharges('2026-08', SUPER_ADMIN);

    expect(prismaMock.supplierCharge.createMany).toHaveBeenCalledWith({
      data: [
        { supplier_id: 's-1', period: '2026-08', amount: fee1 },
        { supplier_id: 's-2', period: '2026-08', amount: fee2 },
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual({ created: 2, skipped: 0, total: 2 });
  });

  it('es idempotente: los proveedores ya cobrados en el periodo se cuentan como skipped, no duplicados', async () => {
    prismaMock.supplier.findMany.mockResolvedValue([
      { id: 's-1', listing_fee_monthly: decimal(50000) },
      { id: 's-2', listing_fee_monthly: decimal(30000) },
    ]);
    // s-1 ya tenía cobro ese periodo → createMany con skipDuplicates solo inserta 1
    prismaMock.supplierCharge.createMany.mockResolvedValue({ count: 1 });

    const result = await generateMonthlyCharges('2026-08', SUPER_ADMIN);

    expect(result).toEqual({ created: 1, skipped: 1, total: 2 });
  });
});

describe('markChargePaid', () => {
  it('rechaza si el actor no es SUPER_ADMIN', async () => {
    await expect(markChargePaid('charge-1', SCHOOL_ADMIN)).rejects.toThrow('No autorizado');
  });

  it('rechaza si el cobro no existe', async () => {
    prismaMock.supplierCharge.findUnique.mockResolvedValue(null);
    await expect(markChargePaid('charge-1', SUPER_ADMIN)).rejects.toThrow('Cobro no encontrado');
  });

  it('rechaza si el cobro ya fue procesado (no está PENDING)', async () => {
    prismaMock.supplierCharge.findUnique.mockResolvedValue({ id: 'charge-1', status: 'PAID' });
    await expect(markChargePaid('charge-1', SUPER_ADMIN)).rejects.toThrow('Este cobro ya fue procesado');
  });

  it('marca el cobro como PAID y registra paid_at', async () => {
    prismaMock.supplierCharge.findUnique.mockResolvedValue({ id: 'charge-1', status: 'PENDING' });
    prismaMock.supplierCharge.update.mockResolvedValue({ id: 'charge-1', status: 'PAID' });

    await markChargePaid('charge-1', SUPER_ADMIN);

    expect(prismaMock.supplierCharge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'charge-1' },
        data: expect.objectContaining({ status: 'PAID', paid_at: expect.any(Date) }),
      }),
    );
  });
});

describe('cancelCharge', () => {
  it('rechaza si el cobro ya fue procesado', async () => {
    prismaMock.supplierCharge.findUnique.mockResolvedValue({ id: 'charge-1', status: 'CANCELLED' });
    await expect(cancelCharge('charge-1', SUPER_ADMIN)).rejects.toThrow('Este cobro ya fue procesado');
  });

  it('cancela un cobro PENDING', async () => {
    prismaMock.supplierCharge.findUnique.mockResolvedValue({ id: 'charge-1', status: 'PENDING' });
    prismaMock.supplierCharge.update.mockResolvedValue({ id: 'charge-1', status: 'CANCELLED' });

    await cancelCharge('charge-1', SUPER_ADMIN);

    expect(prismaMock.supplierCharge.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } }),
    );
  });
});

describe('listCharges', () => {
  it('rechaza si el actor no es SUPER_ADMIN', async () => {
    await expect(listCharges(SCHOOL_ADMIN)).rejects.toThrow('No autorizado');
  });
});
