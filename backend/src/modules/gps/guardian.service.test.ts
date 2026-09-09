import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JwtPayload } from '../../middleware/auth.middleware.js';

const prismaMock = {
  student: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  gPSTracker: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  studentGuardian: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../../lib/email.js', () => ({
  sendGuardianInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

const {
  getStudentPlanSummary,
  enrollGuardian,
  deleteGuardian,
} = await import('./guardian.service.js');

const PARENT: JwtPayload = { sub: 'parent-1', role: 'PARENT', schoolId: null } as JwtPayload;
const OTHER_PARENT: JwtPayload = { sub: 'parent-2', role: 'PARENT', schoolId: null } as JwtPayload;

describe('guardian.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentPlanSummary', () => {
    it('calcula tarifa estándar de $30.000 con 1 familiar incluido si no tiene adicionales', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        id: 'tracker-1',
        imei: '861234567890123',
        device_name: 'Tarjeta Mateo',
        subscription_paid_until: new Date('2026-10-01'),
        included_guardians: 1,
        custom_monthly_price: null,
        custom_guardian_price: null,
        max_emergency_numbers: 3,
      });

      prismaMock.studentGuardian.count.mockResolvedValue(1); // 1 familiar activo

      const summary = await getStudentPlanSummary('student-1', PARENT);

      expect(summary.base_monthly_price).toBe(30000);
      expect(summary.included_guardians).toBe(1);
      expect(summary.active_guardians_count).toBe(1);
      expect(summary.extra_guardians_count).toBe(0);
      expect(summary.total_monthly_price).toBe(30000);
      expect(summary.max_emergency_numbers).toBe(3);
    });

    it('calcula $35.000 si tiene 2 familiares (1 incluido + 1 extra a $5.000)', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        id: 'tracker-1',
        imei: '861234567890123',
        included_guardians: 1,
        custom_monthly_price: null,
        custom_guardian_price: null,
        max_emergency_numbers: 3,
      });

      prismaMock.studentGuardian.count.mockResolvedValue(2); // 2 familiares activos

      const summary = await getStudentPlanSummary('student-1', PARENT);

      expect(summary.active_guardians_count).toBe(2);
      expect(summary.extra_guardians_count).toBe(1);
      expect(summary.extra_guardian_price).toBe(5000);
      expect(summary.total_monthly_price).toBe(35000); // 30000 + 1 * 5000
    });

    it('respeta precios y cupos personalizados configurados para la cuenta', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        id: 'tracker-1',
        imei: '861234567890123',
        included_guardians: 2, // 2 incluidos
        custom_monthly_price: '28000', // tarifa especial
        custom_guardian_price: '4000', // tarifa extra especial
        max_emergency_numbers: 4,
      });

      prismaMock.studentGuardian.count.mockResolvedValue(3); // 3 familiares (2 incluidos + 1 extra)

      const summary = await getStudentPlanSummary('student-1', PARENT);

      expect(summary.base_monthly_price).toBe(28000);
      expect(summary.included_guardians).toBe(2);
      expect(summary.extra_guardians_count).toBe(1);
      expect(summary.total_monthly_price).toBe(32000); // 28000 + 1 * 4000
      expect(summary.max_emergency_numbers).toBe(4);
    });

    it('deniega acceso si el solicitante no es el padre titular ni admin', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      await expect(getStudentPlanSummary('student-1', OTHER_PARENT)).rejects.toThrow(
        'No tienes permiso',
      );
    });
  });

  describe('enrollGuardian', () => {
    it('crea invitación en estado PENDING y envía correo si el usuario aún no tiene cuenta', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'parent-1') return Promise.resolve({ full_name: 'Carlos Padre' });
        return Promise.resolve(null); // el familiar no existe
      });

      prismaMock.studentGuardian.findUnique.mockResolvedValue(null);
      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        included_guardians: 1,
        custom_guardian_price: null,
      });
      prismaMock.studentGuardian.count.mockResolvedValue(0);
      prismaMock.studentGuardian.create.mockImplementation(({ data }: { data: unknown }) => ({
        ...(data as object),
        id: 'share-pending-1',
      }));

      const res = await enrollGuardian('student-1', {
        email: 'f_nis88@hotmail.com',
        relationship: 'MOTHER',
        can_view_live: true,
        can_view_history: true,
        can_receive_alerts: true,
        can_view_meals: false,
      }, PARENT);

      expect(res.status).toBe('PENDING');
      expect(res.guardian_email).toBe('f_nis88@hotmail.com');
      expect(res.guardian_id).toBeNull();
      expect(res.is_included_slot).toBe(true);
      expect(res.message).toContain('Invitación enviada por correo');
    });

    it('asigna is_included_slot=true al primer familiar enrolado cuando ya tiene cuenta', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'parent-1') return Promise.resolve({ full_name: 'Carlos Padre' });
        if (where.email === 'laura@test.com') {
          return Promise.resolve({
            id: 'guardian-user-1',
            role: 'PARENT',
            full_name: 'Laura Madre',
            active: true,
          });
        }
        return Promise.resolve(null);
      });

      prismaMock.studentGuardian.findUnique.mockResolvedValue(null);
      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        included_guardians: 1,
        custom_guardian_price: null,
      });
      prismaMock.studentGuardian.count.mockResolvedValue(0);

      prismaMock.studentGuardian.create.mockImplementation(({ data }: { data: unknown }) => ({
        ...(data as object),
        id: 'share-1',
      }));

      const created = await enrollGuardian('student-1', {
        email: 'laura@test.com',
        relationship: 'MOTHER',
        can_view_live: true,
        can_view_history: true,
        can_receive_alerts: true,
        can_view_meals: false,
      }, PARENT);

      expect(created.is_included_slot).toBe(true);
      expect(created.extra_price).toBe(0);
      expect(created.guardian_id).toBe('guardian-user-1');
      expect(created.status).toBe('ACCEPTED');
    });

    it('asigna is_included_slot=false y extra_price=5000 al segundo familiar cuando el cupo es 1', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'parent-1') return Promise.resolve({ full_name: 'Carlos Padre' });
        if (where.email === 'abuelo@test.com') {
          return Promise.resolve({
            id: 'guardian-user-2',
            role: 'PARENT',
            full_name: 'Abuelo Carlos',
            active: true,
          });
        }
        return Promise.resolve(null);
      });

      prismaMock.studentGuardian.findUnique.mockResolvedValue(null);
      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        included_guardians: 1,
        custom_guardian_price: null,
      });
      prismaMock.studentGuardian.count.mockResolvedValue(1); // Ya hay 1 familiar

      prismaMock.studentGuardian.create.mockImplementation(({ data }: { data: unknown }) => ({
        ...(data as object),
        id: 'share-2',
      }));

      const created = await enrollGuardian('student-1', {
        email: 'abuelo@test.com',
        relationship: 'GRANDPARENT',
        can_view_live: true,
        can_view_history: true,
        can_receive_alerts: true,
        can_view_meals: false,
      }, PARENT);

      expect(created.is_included_slot).toBe(false);
      expect(created.extra_price).toBe(5000);
    });
  });

  describe('deleteGuardian', () => {
    it('elimina el familiar y reasigna los cupos incluidos correctamente', async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        parent_id: 'parent-1',
        school_id: 'school-1',
        full_name: 'Mateo Gómez',
      });

      prismaMock.studentGuardian.findUnique.mockResolvedValue({
        id: 'share-1',
        student_id: 'student-1',
      });

      prismaMock.studentGuardian.delete.mockResolvedValue({ id: 'share-1' });

      prismaMock.gPSTracker.findUnique.mockResolvedValue({
        included_guardians: 1,
        custom_guardian_price: null,
      });

      prismaMock.studentGuardian.findMany.mockResolvedValue([
        { id: 'share-2', is_included_slot: false, extra_price: 5000 },
      ]);

      prismaMock.studentGuardian.update.mockResolvedValue({});

      const result = await deleteGuardian('student-1', 'share-1', PARENT);

      expect(result.success).toBe(true);
      expect(prismaMock.studentGuardian.update).toHaveBeenCalledWith({
        where: { id: 'share-2' },
        data: { is_included_slot: true, extra_price: 0 },
      });
    });
  });
});
