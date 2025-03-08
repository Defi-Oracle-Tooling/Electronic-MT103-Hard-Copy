import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';

export class RateLimiterService {
  private static instance: RateLimiterService;
  private redis: Redis;
  private metrics: MetricsService;

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.initializeRedis();
  }

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  async isAllowed(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / window)}`;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(window / 1000));
      const results = await pipeline.exec();

      if (!results) return false;

      const [, count] = results[0] as [Error | null, number];
      const allowed = count <= limit;

      this.metrics.incrementCounter(allowed ? 'rate_limit_allowed' : 'rate_limit_blocked');
      
      if (!allowed) {
        logger.warn({
          key,
          count,
          limit,
          window
        }, 'Rate limit exceeded');
      }

      return allowed;
    } catch (error) {
      logger.error({ error, key }, 'Rate limit check error');
      return false;
    }
  }

  private initializeRedis(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use different DB than cache
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error in rate limiter');
      this.metrics.incrementCounter('rate_limiter_errors');
    });
  }
}
