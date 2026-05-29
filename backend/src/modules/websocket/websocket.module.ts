import { Module } from '@nestjs/common';
import { KhatmaGateway } from './khatma.gateway';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [KhatmaGateway],
})
export class WebsocketModule {}
