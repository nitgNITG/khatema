import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  @Get('health')
  async health() {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
      await this.db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {}

    try {
      await this.redis.getClient().ping();
      redisStatus = 'connected';
    } catch {}

    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: { database: dbStatus, redis: redisStatus },
    };
  }
}
