import {
  Injectable, ConflictException, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/database/database.service';
import { RedisService } from '@/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReservationService {
  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private events: EventEmitter2,
  ) {}

  async reserve(userId: string, khatmaId: string, partId: string) {
    const lockKey = `lock:part:${partId}`;

    // Step 1: Acquire distributed lock (5s TTL)
    const acquired = await this.redis.acquireLock(lockKey, userId, 5000);
    if (!acquired) {
      throw new ConflictException('الجزء محجوز حالياً، حاول مرة أخرى');
    }

    try {
      return await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        // Verify participant is active
        const participant = await tx.khatmaParticipant.findUnique({
          where: { khatmaId_userId: { khatmaId, userId } },
        });
        if (!participant || participant.status !== 'ACTIVE') {
          throw new ForbiddenException('لست عضواً نشطاً في هذه الختمة');
        }

        // Get khatma settings
        const khatma = await tx.khatma.findUnique({ where: { id: khatmaId } });
        if (!khatma || khatma.status !== 'ACTIVE') {
          throw new BadRequestException('الختمة غير نشطة');
        }

        // Re-check part availability inside transaction
        const part = await tx.quranPart.findUnique({ where: { id: partId } });
        if (!part || part.khatmaId !== khatmaId) throw new NotFoundException('الجزء غير موجود');
        if (part.status !== 'AVAILABLE') throw new ConflictException('الجزء غير متاح');

        // Check if user already has an active reservation (unless allowRepeat)
        if (!khatma.allowRepeat) {
          const existingReservation = await tx.reservedPart.findFirst({
            where: { khatmaId, userId, status: 'RESERVED' },
          });
          if (existingReservation) {
            throw new ConflictException('لديك جزء محجوز بالفعل في هذه الختمة');
          }
        }

        // Atomic: update part + create reservation
        const [updatedPart, reservation] = await Promise.all([
          tx.quranPart.update({
            where: { id: partId, status: 'AVAILABLE' }, // Optimistic check
            data: { status: 'RESERVED' },
          }),
          tx.reservedPart.create({
            data: {
              khatmaId,
              partId,
              userId,
              participantId: participant.id,
              status: 'RESERVED',
            },
          }),
        ]);

        // Emit event for WebSocket broadcast
        this.events.emit('part.reserved', {
          khatmaId,
          partId,
          partNumber: updatedPart.partNumber,
          userId,
        });

        return {
          success: true,
          data: {
            reservationId: reservation.id,
            partNumber: updatedPart.partNumber,
            status: 'RESERVED',
            reservedAt: reservation.reservedAt,
          },
          message: `تم حجز الجزء ${updatedPart.partNumber}`,
        };
      });
    } finally {
      // Always release lock
      await this.redis.releaseLock(lockKey, userId);
    }
  }

  async complete(userId: string, khatmaId: string, partId: string) {
    const reservation = await this.db.reservedPart.findFirst({
      where: { partId, khatmaId, userId, status: 'RESERVED' },
      include: { part: true },
    });

    if (!reservation) {
      throw new NotFoundException('لا يوجد حجز نشط لهذا الجزء');
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException('لا يمكنك تسجيل إتمام جزء لم تحجزه');
    }

    const completedAt = new Date();

    await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reservedPart.update({
        where: { id: reservation.id },
        data: { status: 'COMPLETED', completedAt },
      });

      await tx.quranPart.update({
        where: { id: partId },
        data: { status: 'COMPLETED' },
      });
    });

    // Check if khatma is now complete
    const remainingParts = await this.db.quranPart.count({
      where: { khatmaId, status: { not: 'COMPLETED' } },
    });

    if (remainingParts === 0) {
      await this.handleKhatmaCompletion(khatmaId);
    }

    const khatma = await this.db.khatma.findUnique({
      where: { id: khatmaId },
      select: { totalParts: true },
    });

    const completedCount = await this.db.quranPart.count({
      where: { khatmaId, status: 'COMPLETED' },
    });

    this.events.emit('part.completed', {
      khatmaId,
      partId,
      partNumber: reservation.part.partNumber,
      userId,
      khatmaCompletionPercentage: Math.round((completedCount / (khatma?.totalParts ?? 30)) * 100),
    });

    return {
      success: true,
      data: {
        partNumber: reservation.part.partNumber,
        status: 'COMPLETED',
        completedAt,
        khatmaCompletionPercentage: Math.round((completedCount / (khatma?.totalParts ?? 30)) * 100),
      },
      message: `أحسنت! تم تسجيل إتمام الجزء ${reservation.part.partNumber}`,
    };
  }

  async adminUnreserve(adminId: string, khatmaId: string, partId: string) {
    const participant = await this.db.khatmaParticipant.findUnique({
      where: { khatmaId_userId: { khatmaId, userId: adminId } },
    });
    if (!participant || participant.role !== 'OWNER') {
      throw new ForbiddenException('فقط منشئ الختمة يمكنه إلغاء الحجز');
    }

    const reservation = await this.db.reservedPart.findFirst({
      where: { partId, khatmaId, status: 'RESERVED' },
      include: { part: true },
    });
    if (!reservation) throw new NotFoundException('لا يوجد حجز نشط لهذا الجزء');

    await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reservedPart.update({ where: { id: reservation.id }, data: { status: 'RELEASED' } });
      await tx.quranPart.update({ where: { id: partId }, data: { status: 'AVAILABLE' } });
    });

    this.events.emit('part.unreserved', { khatmaId, partId, partNumber: reservation.part.partNumber });

    return { success: true, message: `تم إلغاء حجز الجزء ${reservation.part.partNumber}` };
  }

  private async handleKhatmaCompletion(khatmaId: string) {
    const khatma = await this.db.khatma.findUnique({ where: { id: khatmaId } });
    if (!khatma) return;

    if (khatma.isContinuous) {
      // Reset all parts for new iteration
      await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.reservedPart.deleteMany({ where: { khatmaId } });
        await tx.quranPart.updateMany({
          where: { khatmaId },
          data: { status: 'AVAILABLE' },
        });
        await tx.khatma.update({
          where: { id: khatmaId },
          data: { iteration: { increment: 1 } },
        });
      });

      this.events.emit('khatma.restarted', { khatmaId, iteration: khatma.iteration + 1 });
    } else {
      await this.db.khatma.update({
        where: { id: khatmaId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      this.events.emit('khatma.completed', { khatmaId, completedAt: new Date() });
    }
  }
}
