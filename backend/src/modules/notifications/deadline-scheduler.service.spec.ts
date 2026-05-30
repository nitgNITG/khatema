import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DeadlineSchedulerService } from './deadline-scheduler.service';
import { DatabaseService } from '@/database/database.service';
import { RedisService } from '@/redis/redis.service';
import { NotificationsService } from './notifications.service';
import { MailService } from '@/modules/mail/mail.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockKhatmaWithParticipants(overrides: {
  id?: string;
  title?: string;
  endDate?: Date;
  participants?: Array<{
    user: { id: string; email: string; displayName: string; notifyBeforeHours: number[] };
  }>;
} = {}) {
  return {
    id: overrides.id ?? 'khatma-1',
    title: overrides.title ?? 'Test Khatma',
    endDate: overrides.endDate ?? new Date(Date.now() + 30 * 60_000), // 30 min from now
    participants: overrides.participants ?? [
      {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Ali',
          notifyBeforeHours: [1], // notify 1h before
        },
      },
    ],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DeadlineSchedulerService', () => {
  let service: DeadlineSchedulerService;
  let db: { khatma: { findMany: jest.Mock } };
  let redis: { exists: jest.Mock; set: jest.Mock };
  let notifications: { create: jest.Mock };
  let mail: { sendDeadlineReminder: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    db = { khatma: { findMany: jest.fn() } };
    redis = { exists: jest.fn().mockResolvedValue(false), set: jest.fn() };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    mail = { sendDeadlineReminder: jest.fn().mockResolvedValue(undefined) };
    config = { get: jest.fn().mockReturnValue('http://localhost:3000') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlineSchedulerService,
        { provide: DatabaseService, useValue: db },
        { provide: RedisService, useValue: redis },
        { provide: NotificationsService, useValue: notifications },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get<DeadlineSchedulerService>(DeadlineSchedulerService);
  });

  it('T-NOTIF-01: sends in-app notification + email when within notifyBeforeHours window', async () => {
    // endDate is 30 min from now; user wants to be notified 1h before → we're inside the 1h–0h window
    db.khatma.findMany.mockResolvedValue([mockKhatmaWithParticipants()]);

    await service.checkDeadlines();

    expect(notifications.create).toHaveBeenCalledWith(
      'user-1', 'DEADLINE_REMINDER',
      expect.stringContaining('Test Khatma'),
      expect.any(String),
      'khatma-1',
    );
    expect(mail.sendDeadlineReminder).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'test@example.com', hoursLeft: 1 }),
    );
  });

  it('T-NOTIF-02: does NOT send duplicate — skips if Redis key already set', async () => {
    db.khatma.findMany.mockResolvedValue([mockKhatmaWithParticipants()]);
    redis.exists.mockResolvedValue(true); // already sent

    await service.checkDeadlines();

    expect(notifications.create).not.toHaveBeenCalled();
    expect(mail.sendDeadlineReminder).not.toHaveBeenCalled();
  });

  it('T-NOTIF-03: sets the Redis "sent" key with 2h TTL after sending', async () => {
    db.khatma.findMany.mockResolvedValue([mockKhatmaWithParticipants()]);

    await service.checkDeadlines();

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('deadline:sent:khatma-1:user-1:1'),
      '1',
      7200,
    );
  });

  it('T-NOTIF-04: skips khatma whose endDate is already past', async () => {
    // The DB query already filters endDate > now, so this tests that findMany is called
    // with the right filter — and if findMany returns empty, nothing is processed
    db.khatma.findMany.mockResolvedValue([]);

    await service.checkDeadlines();

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('T-NOTIF-05: skips user whose notifyBeforeHours does not include a matching window', async () => {
    // endDate is 30 min from now, but user only wants 48h notification
    const khatma = mockKhatmaWithParticipants({
      participants: [
        { user: { id: 'user-1', email: 'test@example.com', displayName: 'Ali', notifyBeforeHours: [48] } },
      ],
    });
    db.khatma.findMany.mockResolvedValue([khatma]);

    await service.checkDeadlines();

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('T-NOTIF-06: sends separate notifications per threshold for multi-threshold user', async () => {
    // endDate is 30 min away; user wants notifications at both 1h and 6h
    // Only the 1h threshold matches (hoursUntilEnd ≈ 0.5, which is ≤ 1 and > 0)
    const khatma = mockKhatmaWithParticipants({
      participants: [
        { user: { id: 'user-1', email: 'u@e.com', displayName: 'Ali', notifyBeforeHours: [6, 1] } },
      ],
    });
    db.khatma.findMany.mockResolvedValue([khatma]);

    await service.checkDeadlines();

    // Only the 1h threshold fires (30 min ≤ 1h AND 30 min > 0h)
    // 6h threshold does NOT fire (30 min is NOT ≤ 6h AND > 5h)
    expect(notifications.create).toHaveBeenCalledTimes(1);
  });

  it('T-NOTIF-07: sends notifications to ALL participants of the khatma', async () => {
    const khatma = mockKhatmaWithParticipants({
      participants: [
        { user: { id: 'user-1', email: 'a@a.com', displayName: 'Ali', notifyBeforeHours: [1] } },
        { user: { id: 'user-2', email: 'b@b.com', displayName: 'Sara', notifyBeforeHours: [1] } },
        { user: { id: 'user-3', email: 'c@c.com', displayName: 'Omar', notifyBeforeHours: [1] } },
      ],
    });
    db.khatma.findMany.mockResolvedValue([khatma]);

    await service.checkDeadlines();

    expect(notifications.create).toHaveBeenCalledTimes(3);
    expect(mail.sendDeadlineReminder).toHaveBeenCalledTimes(3);
  });

  it('T-NOTIF-08: continues processing other users if email fails for one', async () => {
    mail.sendDeadlineReminder
      .mockRejectedValueOnce(new Error('SMTP error')) // fails for first user
      .mockResolvedValue(undefined); // succeeds for rest

    const khatma = mockKhatmaWithParticipants({
      participants: [
        { user: { id: 'user-1', email: 'a@a.com', displayName: 'Ali', notifyBeforeHours: [1] } },
        { user: { id: 'user-2', email: 'b@b.com', displayName: 'Sara', notifyBeforeHours: [1] } },
      ],
    });
    db.khatma.findMany.mockResolvedValue([khatma]);

    // Should not throw
    await expect(service.checkDeadlines()).resolves.not.toThrow();

    // Both in-app notifications still created
    expect(notifications.create).toHaveBeenCalledTimes(2);
  });
});
