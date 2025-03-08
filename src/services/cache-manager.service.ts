import { Redis } from 'ioredis';
import { CacheConfig, CacheStats } from '../types/cache';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';

export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis;
  private metrics: MetricsService;
  private config: CacheConfig;

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.config = {
      ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000000', 10),
      policy: 'lru'
    };
    this.initializeRedis();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.metrics.incrementCounter('cache_misses');
        return null;
      }
      this.metrics.incrementCounter('cache_hits');
      await this.redis.zadd('cache:access', Date.now(), key);
      return JSON.parse(value);
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.set(key, JSON.stringify(value));
      pipeline.expire(key, ttl || this.config.ttl);
      pipeline.zadd('cache:access', Date.now(), key);
      await pipeline.exec();
      
      this.metrics.recordMetric('cache_size', await this.getCurrentSize());
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    }
  }

  async evict(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      await this.redis.zrem('cache:access', key);
      this.metrics.incrementCounter('cache_evictions');
    } catch (error) {
      logger.error({ error, key }, 'Cache eviction error');
    }
  }

  private async getCurrentSize(): Promise<number> {
    return this.redis.dbsize();
  }

  private initializeRedis(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
      this.metrics.incrementCounter('cache_errors');
    });
  }
}
