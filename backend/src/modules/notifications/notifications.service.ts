import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private db: DatabaseService, private events: EventEmitter2) {}

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

  async deleteReadNotifications(userId: string) {
    const { count } = await this.db.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { success: true, deleted: count };
  }

  async create(userId: string, type: string, title: string, body: string, khatmaId?: string) {
    const notification = await this.db.notification.create({
      data: { userId, type: type as any, title, body, khatmaId },
    });
    this.events.emit('notification.created', { userId, notification });
    return notification;
  }

  @OnEvent('khatma.completed')
  async notifyKhatmaCompleted(payload: { khatmaId: string }) {
    const participants = await this.db.khatmaParticipant.findMany({
      where: { khatmaId: payload.khatmaId, status: 'ACTIVE' },
      select: { userId: true },
    });

    for (const p of participants) {
      await this.create(p.userId, 'KHATMA_COMPLETED', 'اكتملت الختمة 🎉', 'أتممتم ختم القرآن الكريم! جزاكم الله خيراً', payload.khatmaId);
    }
  }
}
