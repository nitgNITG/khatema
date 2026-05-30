import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeadlineSchedulerService } from './deadline-scheduler.service';
import { MailModule } from '@/modules/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, DeadlineSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
