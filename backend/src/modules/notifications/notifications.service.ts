import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(private db: DatabaseService) {}

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where: { userId } }),
      this.db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAllRead(userId: string) {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async create(userId: string, type: string, title: string, body: string, khatmaId?: string) {
    return this.db.notification.create({
      data: { userId, type: type as any, title, body, khatmaId },
    });
  }

  @OnEvent('khatma.completed')
  async notifyKhatmaCompleted(payload: { khatmaId: string }) {
    const participants = await this.db.khatmaParticipant.findMany({
      where: { khatmaId: payload.khatmaId, status: 'ACTIVE' },
      select: { userId: true },
    });

    await this.db.notification.createMany({
      data: participants.map((p: { userId: string }) => ({
        userId: p.userId,
        type: 'KHATMA_COMPLETED' as any,
        title: 'اكتملت الختمة 🎉',
        body: 'أتممتم ختم القرآن الكريم! جزاكم الله خيراً',
        khatmaId: payload.khatmaId,
      })),
    });
  }
}
