import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  RATE_LIMIT_KEY_PREFIX,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_SEC,
} from '../constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly enabled: boolean;

  constructor() {
    const url = process.env.REDIS_URL;
    this.enabled = Boolean(url);
    if (this.enabled) {
      this.client = new Redis(url!, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => (times <= 3 ? Math.min(times * 100, 3000) : null),
      });
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds != null && ttlSeconds > 0) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      // Degrade silently
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // Degrade silently
    }
  }

  /**
   * Returns true if the request is allowed (under limit), false if over limit.
   */
  async checkRateLimit(identifier: string): Promise<boolean> {
    if (!this.client) return true;
    const key = `${RATE_LIMIT_KEY_PREFIX}${identifier}`;
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, RATE_LIMIT_WINDOW_SEC);
      }
      return count <= RATE_LIMIT_MAX_REQUESTS;
    } catch {
      return true;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
