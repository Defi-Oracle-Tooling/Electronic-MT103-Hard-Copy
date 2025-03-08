import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';
import { CacheManager } from '../services/cache-manager.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { logger } from '../utils/logger';

export class MonitoringMiddleware {
  private metrics: MetricsService;
  private cache: CacheManager;
  private rateLimiter: RateLimiterService;

  constructor() {
    this.metrics = MetricsService.getInstance();
    this.cache = CacheManager.getInstance();
    this.rateLimiter = RateLimiterService.getInstance();
  }

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestStart = process.hrtime();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Add request tracking
    req.locals = {
      ...req.locals,
      requestId,
      startTime: requestStart
    };

    // Track concurrent requests
    this.metrics.incrementCounter('concurrent_requests');

    // Monitor response
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(requestStart);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      this.metrics.recordMetric('request_duration_ms', duration, {
        path: req.path,
        method: req.method,
        status: res.statusCode.toString()
      });

      this.metrics.decrementCounter('concurrent_requests');

      // Log request completion
      logger.info({
        requestId,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration
      }, 'Request completed');
    });

    // Track memory usage
    const memoryBefore = process.memoryUsage();
    res.on('finish', () => {
      const memoryAfter = process.memoryUsage();
      const memoryDiff = {
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external
      };

      this.metrics.recordMetric('memory_usage_bytes', memoryDiff.heapUsed, {
        path: req.path,
        type: 'heap_used'
      });
    });

    next();
  };
}
