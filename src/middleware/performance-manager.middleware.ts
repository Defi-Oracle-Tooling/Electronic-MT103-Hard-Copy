import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';
import { logger } from '../utils/logger';

export class PerformanceManagerMiddleware {
  private static instance: PerformanceManagerMiddleware;
  private metrics: MetricsService;
  private performanceThresholds = {
    responseTime: 1000, // 1 second
    memoryUsage: 0.8,  // 80% of available memory
    cpuUsage: 0.7      // 70% CPU usage
  };

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.monitorSystemResources();
  }

  public static getInstance(): PerformanceManagerMiddleware {
    if (!PerformanceManagerMiddleware.instance) {
      PerformanceManagerMiddleware.instance = new PerformanceManagerMiddleware();
    }
    return PerformanceManagerMiddleware.instance;
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      // Add response interceptor
      const originalSend = res.send;
      res.send = (...args: any[]): Response => {
        this.recordMetrics(startTime, startMemory);
        return originalSend.apply(res, args);
      };

      next();
    };
  }

  private recordMetrics(startTime: bigint, startMemory: NodeJS.MemoryUsage): void {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

    // Record response time
    this.metrics.recordHistogram('response_time', duration);

    // Record memory impact
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    this.metrics.recordHistogram('memory_impact', memoryDelta);

    // Alert on high resource usage
    if (duration > this.performanceThresholds.responseTime) {
      logger.warn('High response time detected', { duration });
    }
  }

  private monitorSystemResources(): void {
    setInterval(() => {
      this.checkSystemResources();
    }, 60000); // Check every minute
  }

  private async checkSystemResources(): Promise<void> {
    // Implementation for system resource monitoring
  }
}
