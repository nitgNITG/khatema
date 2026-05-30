import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationService } from './reservation.service';
import { DatabaseService } from '@/database/database.service';
import { RedisService } from '@/redis/redis.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDb() {
  const txFns = {
    quranPart: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'part-1', partNumber: 5, status: 'RESERVED' }),
    },
    khatmaParticipant: {
      findUnique: jest.fn(),
    },
    khatma: {
      findUnique: jest.fn(),
    },
    reservedPart: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'res-1', reservedAt: new Date() }),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  return {
    ...txFns,
    quranPart: {
      ...txFns.quranPart,
      count: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'part-1', partNumber: 5 }),
    },
    khatma: {
      ...txFns.khatma,
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reservedPart: {
      ...txFns.reservedPart,
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txFns)),
  };
}

function mockKhatma(overrides: Record<string, unknown> = {}) {
  return {
    id: 'khatma-1', status: 'ACTIVE', allowRepeat: false,
    startDate: null, endDate: null, ...overrides,
  };
}

function mockParticipant(overrides: Record<string, unknown> = {}) {
  return { id: 'participant-1', khatmaId: 'khatma-1', userId: 'user-1', role: 'MEMBER', status: 'ACTIVE', ...overrides };
}

function mockPart(overrides: Record<string, unknown> = {}) {
  return { id: 'part-1', khatmaId: 'khatma-1', partNumber: 5, status: 'AVAILABLE', ...overrides };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ReservationService', () => {
  let service: ReservationService;
  let db: ReturnType<typeof buildDb>;
  let redis: { acquireLock: jest.Mock; releaseLock: jest.Mock; get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let events: { emit: jest.Mock };

  beforeEach(async () => {
    db = buildDb();
    redis = { acquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn(), get: jest.fn(), set: jest.fn(), del: jest.fn() };
    events = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: DatabaseService, useValue: db },
        { provide: RedisService, useValue: redis },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get<ReservationService>(ReservationService);
  });

  // Shorthand to wire up a happy-path transaction
  function wireHappyPath(khatmaOverrides: Record<string, unknown> = {}) {
    const participant = mockParticipant();
    const khatma = mockKhatma(khatmaOverrides);
    const part = mockPart();

    const txFns = {
      khatmaParticipant: { findUnique: jest.fn().mockResolvedValue(participant) },
      khatma: { findUnique: jest.fn().mockResolvedValue(khatma) },
      quranPart: {
        findUnique: jest.fn().mockResolvedValue(part),
        update: jest.fn().mockResolvedValue({ ...part, status: 'RESERVED' }),
      },
      reservedPart: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'res-1', reservedAt: new Date() }),
      },
    };

    db.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(txFns));
    db.khatma.findUnique.mockResolvedValue(khatma);
    db.quranPart.count.mockResolvedValue(5);
    return { participant, khatma, part, txFns };
  }

  // ── reserve — startDate enforcement ────────────────────────────────────────

  describe('reserve — startDate enforcement', () => {
    it('T-RES-01: succeeds when khatma has no startDate', async () => {
      wireHappyPath({ startDate: null });
      const result = await service.reserve('user-1', 'khatma-1', 'part-1');
      expect(result.success).toBe(true);
    });

    it('T-RES-02: succeeds when startDate is in the past', async () => {
      wireHappyPath({ startDate: new Date(Date.now() - 3_600_000) }); // 1h ago
      const result = await service.reserve('user-1', 'khatma-1', 'part-1');
      expect(result.success).toBe(true);
    });

    it('T-RES-03: blocks reservation when startDate is in the future (7 PM tonight scenario)', async () => {
      const futureStart = new Date(Date.now() + 3_600_000); // 1h from now

      const participant = mockParticipant();
      const khatma = mockKhatma({ startDate: futureStart });
      const part = mockPart();

      const txFns = {
        khatmaParticipant: { findUnique: jest.fn().mockResolvedValue(participant) },
        khatma: { findUnique: jest.fn().mockResolvedValue(khatma) },
        quranPart: { findUnique: jest.fn().mockResolvedValue(part), update: jest.fn() },
        reservedPart: { findFirst: jest.fn(), create: jest.fn() },
      };
      db.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(txFns));

      await expect(service.reserve('user-1', 'khatma-1', 'part-1'))
        .rejects.toThrow(BadRequestException);

      // Verify the update (reserve) was never called
      expect(txFns.quranPart.update).not.toHaveBeenCalled();
      expect(txFns.reservedPart.create).not.toHaveBeenCalled();
    });

    it('T-RES-04: succeeds immediately after startDate passes (change to now)', async () => {
      // startDate = 100ms ago (just passed)
      wireHappyPath({ startDate: new Date(Date.now() - 100) });
      const result = await service.reserve('user-1', 'khatma-1', 'part-1');
      expect(result.success).toBe(true);
    });

    it('T-RES-05: after changing startDate from 7 PM to 8 PM — still blocked', async () => {
      // Simulates: owner edits startDate from 7 PM to 8 PM (both still in future)
      const eightPM = new Date(Date.now() + 7_200_000); // 2h from now

      const participant = mockParticipant();
      const khatma = mockKhatma({ startDate: eightPM });
      const part = mockPart();

      const txFns = {
        khatmaParticipant: { findUnique: jest.fn().mockResolvedValue(participant) },
        khatma: { findUnique: jest.fn().mockResolvedValue(khatma) },
        quranPart: { findUnique: jest.fn().mockResolvedValue(part), update: jest.fn() },
        reservedPart: { findFirst: jest.fn(), create: jest.fn() },
      };
      db.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(txFns));

      await expect(service.reserve('user-1', 'khatma-1', 'part-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('T-RES-06: succeeds after owner changes startDate to "now"', async () => {
      wireHappyPath({ startDate: new Date(Date.now() - 50) }); // effectively now
      const result = await service.reserve('user-1', 'khatma-1', 'part-1');
      expect(result.success).toBe(true);
    });

    it('T-RES-07: fails to acquire Redis lock → conflict exception', async () => {
      redis.acquireLock.mockResolvedValue(false);
      await expect(service.reserve('user-1', 'khatma-1', 'part-1'))
        .rejects.toThrow(ConflictException);
    });

    it('T-RES-08: releases lock even when transaction throws', async () => {
      const txFns = {
        khatmaParticipant: { findUnique: jest.fn().mockResolvedValue(mockParticipant()) },
        khatma: { findUnique: jest.fn().mockResolvedValue(mockKhatma()) },
        quranPart: {
          findUnique: jest.fn().mockResolvedValue(mockPart({ status: 'RESERVED' })), // already taken
          update: jest.fn(),
        },
        reservedPart: { findFirst: jest.fn(), create: jest.fn() },
      };
      db.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(txFns));

      await expect(service.reserve('user-1', 'khatma-1', 'part-1'))
        .rejects.toThrow(ConflictException);

      expect(redis.releaseLock).toHaveBeenCalledWith('lock:part:part-1', 'user-1');
    });
  });

  // ── cancelReservation ───────────────────────────────────────────────────────

  describe('cancelReservation', () => {
    it('T-CAN-01: deletes the reservation record and sets part to AVAILABLE', async () => {
      const reservation = { id: 'res-1', part: { id: 'part-1', partNumber: 5 } };
      db.reservedPart.findFirst.mockResolvedValue(reservation);

      const txDelete = jest.fn().mockResolvedValue({});
      const txUpdate = jest.fn().mockResolvedValue({});
      const tx = {
        reservedPart: { delete: txDelete },
        quranPart: { update: txUpdate },
      };
      db.$transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

      const result = await service.cancelReservation('user-1', 'khatma-1', 'part-1');

      expect(result.success).toBe(true);
      expect(txDelete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
      expect(txUpdate).toHaveBeenCalledWith({ where: { id: 'part-1' }, data: { status: 'AVAILABLE' } });
      expect(events.emit).toHaveBeenCalledWith('part.unreserved', expect.objectContaining({ khatmaId: 'khatma-1' }));
    });

    it('T-CAN-02: returns 404 when no active reservation exists', async () => {
      db.reservedPart.findFirst.mockResolvedValue(null);

      await expect(service.cancelReservation('user-1', 'khatma-1', 'part-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
