import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type { CreateOrderInput } from './order.schemas.js';

// Decimal-like stub matching Prisma's Decimal (.toNumber() is the only method the service uses)
function decimal(n: number) {
  return { toNumber: () => n } as unknown as { toNumber: () => number };
}

const prismaMock = {
  student: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  school: { findUnique: vi.fn() },
  store: { findUnique: vi.fn() },
  storeProduct: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  lunchOrder: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  transaction: { create: vi.fn() },
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
  chatThread: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  chatMessage: { create: vi.fn(), groupBy: vi.fn() },
  nutritionDailyReport: { upsert: vi.fn() },
  orderItem: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
};
// $transaction(cb) must run cb against the same mocked client, since the
// service calls tx.<model>.<method> on whatever prisma.$transaction hands it.
prismaMock.$transaction.mockImplementation((arg: unknown) => {
  if (typeof arg === 'function') return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
  return Promise.all(arg as Promise<unknown>[]);
});

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../push/push.service.js', () => ({ sendPushToUser: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../gps/gps.service.js', () => ({ resolveStudentByQrToken: vi.fn() }));

const { createOrder, deliverOrder, cancelOrder, cancelOrderPartial } = await import('./order.service.js');

const PARENT: JwtPayload = { sub: 'parent-1', role: 'PARENT', schoolId: null } as JwtPayload;
const VENDOR: JwtPayload = { sub: 'vendor-1', role: 'VENDOR', schoolId: 'school-1' } as JwtPayload;

const baseOrderSelectRow = {
  id: 'order-1',
  school_id: 'school-1',
  status: 'CONFIRMED',
  total_amount: decimal(10000),
  charged_amount: decimal(10000),
  student: {
    id: 'student-1',
    full_name: 'Ana',
    parent_id: 'parent-1',
    balance: decimal(5000),
    delivery_code: '123456',
  },
  school: { id: 'school-1' },
  order_items: [] as unknown[],
  notes: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
    return Promise.all(arg as Promise<unknown>[]);
  });
});

describe('createOrder — validación de saldo y stock', () => {
  const input: CreateOrderInput = {
    student_id: 'student-1',
    store_id: 'store-1',
    scheduled_date: '2099-01-01',
    items: [{ store_product_id: 'sp-1', quantity: 1 }],
  };

  function mockHappyPathSetup(opts: { balance: number; stock: number | null; price: number; dailyLimit?: number; alreadySpentToday?: number }) {
    prismaMock.student.findUnique.mockResolvedValue({
      id: 'student-1', school_id: 'school-1', parent_id: 'parent-1', active: true, balance: decimal(opts.balance),
      daily_spending_limit: decimal(opts.dailyLimit ?? 15000),
    });
    prismaMock.school.findUnique.mockResolvedValue({ meal_payment_model: 'PER_ORDER' });
    prismaMock.lunchOrder.aggregate.mockResolvedValue({
      _sum: { charged_amount: opts.alreadySpentToday !== undefined ? decimal(opts.alreadySpentToday) : null },
    });
    prismaMock.store.findUnique.mockResolvedValue({ id: 'store-1', active: true, school_id: 'school-1' });
    prismaMock.storeProduct.findMany.mockResolvedValue([
      {
        id: 'sp-1', price: decimal(opts.price), stock: opts.stock, is_pension_extra: false,
        product: {
          id: 'p-1', name: 'Lonchera', base_price: decimal(opts.price), customizable_options: [],
          nutritional_level: 'LEVEL_1', seal_sodium: false, seal_sugars: false,
          seal_saturated_fat: false, seal_trans_fat: false, seal_sweeteners: false,
        },
      },
    ]);
    prismaMock.lunchOrder.create.mockResolvedValue({ id: 'order-1' });
  }

  it('rechaza el pedido si el estudiante no existe o está inactivo', async () => {
    prismaMock.student.findUnique.mockResolvedValue(null);
    await expect(createOrder(input, PARENT)).rejects.toThrow('Estudiante no encontrado');
  });

  it('rechaza el pedido si el padre no es dueño del estudiante', async () => {
    prismaMock.student.findUnique.mockResolvedValue({
      id: 'student-1', school_id: 'school-1', parent_id: 'otro-padre', active: true, balance: decimal(5000),
    });
    await expect(createOrder(input, PARENT)).rejects.toThrow('No puedes crear pedidos para este estudiante');
  });

  it('rechaza el pedido si no hay stock suficiente', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 0, price: 5000 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('Stock insuficiente');
  });

  it('rechaza el pedido si el saldo es insuficiente', async () => {
    mockHappyPathSetup({ balance: 1000, stock: 10, price: 5000 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('Saldo insuficiente');
  });

  it('guarda anti-carrera: si el descuento atómico de stock falla (alguien más compró antes), rechaza el pedido', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000 });
    prismaMock.storeProduct.updateMany.mockResolvedValue({ count: 0 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('Alguien más lo compró justo antes');
  });

  it('guarda anti-carrera: si el descuento atómico de saldo falla (doble gasto concurrente), rechaza el pedido', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000 });
    prismaMock.storeProduct.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.student.updateMany.mockResolvedValue({ count: 0 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('Saldo insuficiente');
  });

  it('rechaza el pedido si supera el límite de gasto diario configurado por el padre', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000, dailyLimit: 4000 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('supera el límite diario de gasto');
  });

  it('rechaza el pedido si, sumado a lo ya gastado ese día, supera el límite diario', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000, dailyLimit: 8000, alreadySpentToday: 4000 });
    await expect(createOrder(input, PARENT)).rejects.toThrow('supera el límite diario de gasto');
  });

  it('permite el pedido si está dentro del límite diario disponible', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000, dailyLimit: 15000, alreadySpentToday: 9000 });
    prismaMock.storeProduct.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.student.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.student.findUniqueOrThrow.mockResolvedValue({ balance: decimal(95000) });

    await expect(createOrder(input, PARENT)).resolves.toBeDefined();
  });

  it('crea el pedido, descuenta saldo y registra la transacción CHARGE cuando todo es válido', async () => {
    mockHappyPathSetup({ balance: 100000, stock: 10, price: 5000 });
    prismaMock.storeProduct.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.student.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.student.findUniqueOrThrow.mockResolvedValue({ balance: decimal(95000) });

    await createOrder(input, PARENT);

    expect(prismaMock.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'CHARGE', amount: 5000, order_id: 'order-1' }),
      }),
    );
  });

  it('colegios de pensión incluida: solo cobra los ítems marcados como extra, el resto queda cubierto por la pensión', async () => {
    prismaMock.student.findUnique.mockResolvedValue({
      id: 'student-1', school_id: 'school-1', parent_id: 'parent-1', active: true, balance: decimal(1000),
    });
    prismaMock.school.findUnique.mockResolvedValue({ meal_payment_model: 'INCLUDED' });
    prismaMock.store.findUnique.mockResolvedValue({ id: 'store-1', active: true, school_id: 'school-1' });
    prismaMock.storeProduct.findMany.mockResolvedValue([
      {
        id: 'sp-1', price: decimal(5000), stock: 10, is_pension_extra: false, // cubierto por pensión
        product: {
          id: 'p-1', name: 'Menú del día', base_price: decimal(5000), customizable_options: [],
          nutritional_level: 'LEVEL_1', seal_sodium: false, seal_sugars: false,
          seal_saturated_fat: false, seal_trans_fat: false, seal_sweeteners: false,
        },
      },
    ]);
    prismaMock.lunchOrder.create.mockResolvedValue({ id: 'order-1' });

    await createOrder(input, PARENT);

    // No debía cobrarse nada (chargeableAmount = 0) → no se toca el saldo ni se crea Transaction
    expect(prismaMock.student.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });
});

describe('deliverOrder — verificación de entrega por OTP', () => {
  it('rechaza la entrega si el pedido no está CONFIRMED', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'PENDING' });
    await expect(deliverOrder('order-1', '123456', VENDOR)).rejects.toThrow('Solo se pueden entregar pedidos confirmados');
  });

  it('rechaza la entrega si el código OTP no coincide', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'CONFIRMED' });
    await expect(deliverOrder('order-1', '000000', VENDOR)).rejects.toThrow('Código de entrega inválido');
  });

  it('marca el pedido como DELIVERED cuando el OTP coincide', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'CONFIRMED' });
    prismaMock.lunchOrder.update.mockResolvedValue({ ...baseOrderSelectRow, status: 'DELIVERED' });
    prismaMock.lunchOrder.findMany.mockResolvedValue([]);

    const result = await deliverOrder('order-1', '123456', VENDOR);

    expect(result.status).toBe('DELIVERED');
    expect(prismaMock.lunchOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DELIVERED', otp_verified: true }),
      }),
    );
  });
});

describe('cancelOrder — reembolso completo', () => {
  it('rechaza cancelar un pedido ya entregado, reembolsado o cancelado', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'DELIVERED' });
    await expect(cancelOrder('order-1', PARENT)).rejects.toThrow('Este pedido no se puede cancelar');
  });

  it('el padre solo puede cancelar pedidos PENDING (no CONFIRMED)', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'CONFIRMED' });
    await expect(cancelOrder('order-1', PARENT)).rejects.toThrow('Solo puedes cancelar pedidos pendientes');
  });

  it('reembolsa el monto total del pedido al cancelarlo', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'PENDING' });
    prismaMock.lunchOrder.update.mockResolvedValue({ ...baseOrderSelectRow, status: 'CANCELLED' });
    prismaMock.student.update.mockResolvedValue({ balance: decimal(15000) });

    await cancelOrder('order-1', PARENT);

    expect(prismaMock.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'REFUND', amount: 10000, order_id: 'order-1' }),
      }),
    );
  });
});

describe('cancelOrderPartial — cancelación con cobro de insumos (reembolso 50%)', () => {
  it('reembolsa exactamente el 50% del total_amount', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'CONFIRMED' });
    prismaMock.lunchOrder.update.mockResolvedValue({ ...baseOrderSelectRow, status: 'CANCELLED' });
    prismaMock.student.update.mockResolvedValue({ balance: decimal(10000) });

    await cancelOrderPartial('order-1', PARENT);

    expect(prismaMock.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'REFUND', amount: 5000, order_id: 'order-1' }),
      }),
    );
  });

  it('solo el padre dueño del pedido puede solicitar esta cancelación', async () => {
    prismaMock.lunchOrder.findUnique.mockResolvedValue({ ...baseOrderSelectRow, status: 'CONFIRMED' });
    await expect(cancelOrderPartial('order-1', VENDOR)).rejects.toThrow('Solo el padre del pedido puede solicitar esta cancelación');
  });
});
