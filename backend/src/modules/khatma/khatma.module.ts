import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { KhatmaController } from './khatma.controller';
import { KhatmaService } from './khatma.service';
import { ReservationService } from './reservation.service';
import { MailModule } from '@/modules/mail/mail.module';

@Module({
  imports: [EventEmitterModule.forRoot(), MailModule],
  controllers: [KhatmaController],
  providers: [KhatmaService, ReservationService],
  exports: [KhatmaService, ReservationService],
})
export class KhatmaModule {}
