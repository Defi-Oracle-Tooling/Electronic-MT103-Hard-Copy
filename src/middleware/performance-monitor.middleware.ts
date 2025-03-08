import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';
import { logger } from '../utils/logger';

export class PerformanceMonitorMiddleware {
  private metricsService: MetricsService;
  private readonly slowRequestThreshold: number;

  constructor() {
    this.metricsService = MetricsService.getInstance();
    this.slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1000', 10);
  }

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      const endMemory = process.memoryUsage().heapUsed;

      this.recordMetrics(req, res, duration, startMemory, endMemory);

      if (duration > this.slowRequestThreshold) {
        this.logSlowRequest(req, duration);
      }
    });

    next();
  };

  private recordMetrics(
    req: Request, 
    res: Response, 
    duration: number,
    startMemory: number,
    endMemory: number
  ): void {
    const path = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    this.metricsService.recordMetric('request_duration_ms', duration, {
      path,
      method,
      status_code: statusCode.toString()
    });

    this.metricsService.recordMetric('request_memory_bytes', endMemory - startMemory, {
      path,
      method
    });
  }

  private logSlowRequest(req: Request, duration: number): void {
    logger.warn({
      path: req.path,
      method: req.method,
      duration,
      threshold: this.slowRequestThreshold
    }, 'Slow request detected');
  }
}
