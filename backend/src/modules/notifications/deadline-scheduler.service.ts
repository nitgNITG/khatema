import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import { RedisService } from '@/redis/redis.service';
import { NotificationsService } from './notifications.service';
import { MailService } from '@/modules/mail/mail.service';

@Injectable()
export class DeadlineSchedulerService {
  private readonly logger = new Logger(DeadlineSchedulerService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private notifications: NotificationsService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  // Runs every hour
  @Cron('0 * * * *')
  async checkDeadlines() {
    this.logger.log('Checking khatma deadlines...');

    const now = new Date();
    // Find all active khatmas with an endDate in the future
    const khatmas = await (this.db.khatma.findMany as any)({
      where: {
        status: 'ACTIVE',
        endDate: { gt: now },
        deletedAt: null,
      },
      include: {
        participants: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, email: true, displayName: true, notifyBeforeHours: true } },
          },
        },
      },
    }) as any[];

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    for (const khatma of khatmas) {
      const msUntilEnd = new Date(khatma.endDate!).getTime() - now.getTime();
      const hoursUntilEnd = msUntilEnd / (1000 * 60 * 60);

      for (const participant of khatma.participants) {
        const prefs = participant.user.notifyBeforeHours as number[];
        if (!Array.isArray(prefs)) continue;

        for (const notifyHours of prefs) {
          // Trigger if we're within 1 hour of the threshold
          if (hoursUntilEnd <= notifyHours && hoursUntilEnd > notifyHours - 1) {
            const sentKey = `deadline:sent:${khatma.id}:${participant.user.id}:${notifyHours}`;
            const alreadySent = await this.redis.exists(sentKey);
            if (alreadySent) continue;

            // Mark as sent (TTL: 2 hours to prevent duplicates)
            await this.redis.set(sentKey, '1', 7200);

            // App notification
            await this.notifications.create(
              participant.user.id,
              'DEADLINE_REMINDER',
              `تذكير: ختمة "${khatma.title}"`,
              `تنتهي ختمة "${khatma.title}" خلال ${notifyHours} ساعة`,
              khatma.id,
            );

            // Email notification
            if (participant.user.email) {
              await this.mail.sendDeadlineReminder({
                toEmail: participant.user.email,
                displayName: participant.user.displayName,
                khatmaTitle: khatma.title,
                endDate: khatma.endDate!,
                hoursLeft: notifyHours,
                khatmaUrl: `${frontendUrl}/khatma/${khatma.id}`,
              }).catch((e) => this.logger.error(`Failed to send deadline email: ${e.message}`));
            }
          }
        }
      }
    }
  }
}
