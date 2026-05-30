import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    const password = this.config.get<string>('REDIS_PASSWORD');
    this.client = password
      ? new Redis({ host: 'localhost', port: 6379, password, maxRetriesPerRequest: 3, lazyConnect: true })
      : new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Distributed lock: SET key value NX PX ttl
  async acquireLock(key: string, owner: string, ttlMs: number): Promise<boolean> {
    // Redis SET key value NX PX ms — use call() to bypass ioredis overload restrictions
    const result = await (this.client as any).call('SET', key, owner, 'NX', 'PX', ttlMs) as string | null;
    return result === 'OK';
  }

  async releaseLock(key: string, owner: string): Promise<void> {
    const current = await this.client.get(key);
    if (current === owner) {
      await this.client.del(key);
    }
  }

  // Sliding window rate limiter
  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; count: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const member = `${now}-${Math.random()}`;

    const pipeline = this.client.pipeline();
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    pipeline.zadd(key, now, member);
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    const results = await pipeline.exec();

    const count = results?.[2]?.[1] as number ?? 0;
    return { allowed: count <= limit, count };
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1 && ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }
}
