import { RedisClient } from 'redis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { MetricsService } from '../services/metrics.service';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
  keyPrefix: string;
}

export class RateLimiterConfig {
  private static instance: RateLimiterConfig;
  private redis: RedisClient;
  private metrics: MetricsService;

  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    statusCode: 429,
    keyPrefix: 'rl:'
  };

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.redis = new RedisClient({
      // Redis configuration...
    });
  }

  public static getInstance(): RateLimiterConfig {
    if (!RateLimiterConfig.instance) {
      RateLimiterConfig.instance = new RateLimiterConfig();
    }
    return RateLimiterConfig.instance;
  }

  /**
   * Create rate limiter middleware
   */
  public createRateLimiter(config?: Partial<RateLimitConfig>) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req, finalConfig);
      
      try {
        const result = await this.checkRateLimit(key, finalConfig);
        
        if (!result.allowed) {
          this.metrics.incrementCounter('rate_limit_exceeded');
          return res.status(finalConfig.statusCode).json({
            error: finalConfig.message,
            retryAfter: result.retryAfter
          });
        }
        
        next();
      } catch (error) {
        logger.error('Rate limiter error', { error: (error as Error).message });
        // Allow request through on rate limiter error
        next();
      }
    };
  }

  // Additional rate limiting methods...
}
