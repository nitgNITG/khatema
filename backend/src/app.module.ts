import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KhatmaModule } from './modules/khatma/khatma.module';
import { GroupsModule } from './modules/groups/groups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { AdsModule } from './modules/ads/ads.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    KhatmaModule,
    GroupsModule,
    NotificationsModule,
    WebsocketModule,
    AdminModule,
    ArticlesModule,
    SuggestionsModule,
    AdsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
