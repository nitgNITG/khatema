import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { KhatmaService } from './khatma.service';
import { DatabaseService } from '@/database/database.service';

// ─── Shared mock factory ──────────────────────────────────────────────────────

function mockKhatma(overrides: Record<string, unknown> = {}) {
  return {
    id: 'khatma-1',
    creatorId: 'user-1',
    title: 'Test Khatma',
    description: null,
    type: 'COLLECTIVE',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    requireApproval: false,
    allowRepeat: false,
    isContinuous: false,
    autoRedistribute: false,
    maxMembers: null,
    shareCode: 'share-1',
    shareEnabled: true,
    startDate: null,
    endDate: null,
    completedAt: null,
    totalParts: 30,
    iteration: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    groupId: null,
    ...overrides,
  };
}

function buildDb() {
  const txFns = {
    auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    invitation: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    reservedPart: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    khatma: { delete: jest.fn().mockResolvedValue({}) },
  };

  return {
    khatma: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    quranPart: { createMany: jest.fn() },
    khatmaParticipant: { create: jest.fn(), count: jest.fn() },
    reservedPart: { count: jest.fn(), deleteMany: jest.fn() },
    auditLog: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
    invitation: { deleteMany: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txFns)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('KhatmaService', () => {
  let service: KhatmaService;
  let db: ReturnType<typeof buildDb>;

  beforeEach(async () => {
    db = buildDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KhatmaService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();
    service = module.get<KhatmaService>(KhatmaService);
  });

  // ── deleteKhatma ────────────────────────────────────────────────────────────

  describe('deleteKhatma', () => {
    it('T-DEL-01: deletes a fresh khatma with no reservations', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.reservedPart.count.mockResolvedValue(0);

      const result = await service.deleteKhatma('user-1', 'khatma-1');

      expect(result.success).toBe(true);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it('T-DEL-02: deletes when only RELEASED reservations exist (cancelled parts)', async () => {
      // RELEASED reservations are deleted records in current impl, but count only checks RESERVED/COMPLETED
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.reservedPart.count.mockResolvedValue(0); // no RESERVED/COMPLETED

      const result = await service.deleteKhatma('user-1', 'khatma-1');
      expect(result.success).toBe(true);
    });

    it('T-DEL-03: blocks deletion when a RESERVED part exists', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.reservedPart.count.mockResolvedValue(1); // 1 RESERVED part

      await expect(service.deleteKhatma('user-1', 'khatma-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('T-DEL-04: blocks deletion when a COMPLETED part exists', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.reservedPart.count.mockResolvedValue(3); // completed parts

      await expect(service.deleteKhatma('user-1', 'khatma-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('T-DEL-05: returns 403 for non-owner', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma({ creatorId: 'other-user' }));
      db.reservedPart.count.mockResolvedValue(0);

      await expect(service.deleteKhatma('user-1', 'khatma-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('T-DEL-06: returns 404 for non-existent khatma', async () => {
      db.khatma.findFirst.mockResolvedValue(null);

      await expect(service.deleteKhatma('user-1', 'khatma-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('T-DEL-07: transaction deletes audit logs, notifications, invitations, reservedParts, then khatma', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.reservedPart.count.mockResolvedValue(0);

      const txAudit = jest.fn().mockResolvedValue({ count: 0 });
      const txNotif = jest.fn().mockResolvedValue({ count: 0 });
      const txInvite = jest.fn().mockResolvedValue({ count: 0 });
      const txReserved = jest.fn().mockResolvedValue({ count: 0 });
      const txDelete = jest.fn().mockResolvedValue({});

      const tx = {
        auditLog: { deleteMany: txAudit },
        notification: { deleteMany: txNotif },
        invitation: { deleteMany: txInvite },
        reservedPart: { deleteMany: txReserved },
        khatma: { delete: txDelete },
      };
      db.$transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

      await service.deleteKhatma('user-1', 'khatma-1');

      expect(txAudit).toHaveBeenCalledWith({ where: { khatmaId: 'khatma-1' } });
      expect(txNotif).toHaveBeenCalledWith({ where: { khatmaId: 'khatma-1' } });
      expect(txInvite).toHaveBeenCalledWith({ where: { khatmaId: 'khatma-1' } });
      expect(txReserved).toHaveBeenCalledWith({ where: { khatmaId: 'khatma-1' } });
      expect(txDelete).toHaveBeenCalledWith({ where: { id: 'khatma-1' } });
    });
  });

  // ── editKhatma ──────────────────────────────────────────────────────────────

  describe('editKhatma', () => {
    function stubUpdate(extra: Record<string, unknown> = {}) {
      const base = mockKhatma(extra);
      db.khatma.update.mockResolvedValue(base);
    }

    it('T-EDIT-01: updates title and description', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      stubUpdate();

      await service.editKhatma('user-1', 'khatma-1', { title: 'New Title', description: 'New Desc' });
      expect(db.khatma.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: 'New Title' }) }),
      );
    });

    it('T-EDIT-02: sets startDate', async () => {
      const future = new Date(Date.now() + 3_600_000).toISOString();
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.khatma.update.mockResolvedValue(mockKhatma({ startDate: new Date(future) }));

      const result = await service.editKhatma('user-1', 'khatma-1', { startDate: future });
      expect(result.startDate).toEqual(new Date(future));
    });

    it('T-EDIT-03: sets endDate', async () => {
      const future = new Date(Date.now() + 7_200_000).toISOString();
      db.khatma.findFirst.mockResolvedValue(mockKhatma());
      db.khatma.update.mockResolvedValue(mockKhatma({ endDate: new Date(future) }));

      const result = await service.editKhatma('user-1', 'khatma-1', { endDate: future });
      expect(result.endDate).toEqual(new Date(future));
    });

    it('T-EDIT-04: clears startDate when set to null', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma({ startDate: new Date() }));
      db.khatma.update.mockResolvedValue(mockKhatma({ startDate: null }));

      const result = await service.editKhatma('user-1', 'khatma-1', { startDate: null });
      expect(result.startDate).toBeNull();
    });

    it('T-EDIT-05: rejects when endDate <= startDate (both in same call)', async () => {
      const now = Date.now();
      db.khatma.findFirst.mockResolvedValue(mockKhatma());

      await expect(service.editKhatma('user-1', 'khatma-1', {
        startDate: new Date(now + 7_200_000).toISOString(),
        endDate: new Date(now + 3_600_000).toISOString(),
      })).rejects.toThrow(BadRequestException);
    });

    it('T-EDIT-06: rejects when new endDate is before existing startDate', async () => {
      const existingStart = new Date(Date.now() + 3_600_000); // 1h from now
      db.khatma.findFirst.mockResolvedValue(mockKhatma({ startDate: existingStart }));

      // Only providing endDate (startDate comes from DB)
      await expect(service.editKhatma('user-1', 'khatma-1', {
        endDate: new Date(Date.now() + 1_800_000).toISOString(), // 30 min from now — before existing start
      })).rejects.toThrow(BadRequestException);
    });

    it('T-EDIT-07: rejects when new startDate pushes past existing endDate', async () => {
      const existingEnd = new Date(Date.now() + 3_600_000); // 1h from now
      db.khatma.findFirst.mockResolvedValue(mockKhatma({ endDate: existingEnd }));

      // Only providing startDate that would be after the existing endDate
      await expect(service.editKhatma('user-1', 'khatma-1', {
        startDate: new Date(Date.now() + 7_200_000).toISOString(), // 2h from now — after existing end
      })).rejects.toThrow(BadRequestException);
    });

    it('T-EDIT-08: returns 403 for non-owner', async () => {
      db.khatma.findFirst.mockResolvedValue(mockKhatma({ creatorId: 'other' }));

      await expect(service.editKhatma('user-1', 'khatma-1', { title: 'x' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('T-EDIT-09: returns 404 for non-existent khatma', async () => {
      db.khatma.findFirst.mockResolvedValue(null);

      await expect(service.editKhatma('user-1', 'khatma-1', { title: 'x' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
