import { Request, Response, NextFunction } from 'express';
import { RedisClient } from 'redis';
import { MetricsService } from '../services/metrics.service';
import { logger } from '../utils/logger';

export class ThrottlingManager {
  private static instance: ThrottlingManager;
  private redis: RedisClient;
  private metrics: MetricsService;
  private readonly defaultRules = {
    maxRequests: 100,
    windowMs: 60000,
    delayAfter: 75,
    delayMs: 100
  };

  private dynamicThrottling = {
    enabled: true,
    loadThreshold: 0.75,
    scaleDownFactor: 0.5,
    scaleUpFactor: 1.5
  };

  constructor() {
    this.metrics = MetricsService.getInstance();
    this.initializeRedis();
    this.startLoadMonitoring();
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req);
      const currentLoad = await this.getCurrentLoad(key);
      
      if (await this.shouldThrottle(key, currentLoad)) {
        const delay = this.calculateDelay(currentLoad);
        setTimeout(next, delay);
      } else {
        next();
      }
    };
  }

  private async shouldThrottle(key: string, currentLoad: number): Promise<boolean> {
    // If system load is high, increase throttling
    if (currentLoad > this.dynamicThrottling.loadThreshold) {
      const adjustedMaxRequests = Math.floor(
        this.defaultRules.maxRequests * this.dynamicThrottling.scaleDownFactor
      );
      const requests = await this.getRequestCount(key);
      return requests >= adjustedMaxRequests;
    }

    // Normal throttling logic
    const requests = await this.getRequestCount(key);
    return requests >= this.defaultRules.maxRequests;
  }

  private calculateDelay(currentLoad: number): number {
    let baseDelay = this.defaultRules.delayMs;
    
    if (currentLoad > this.dynamicThrottling.loadThreshold) {
      // Exponentially increase delay based on load
      const loadFactor = currentLoad / this.dynamicThrottling.loadThreshold;
      baseDelay *= Math.pow(loadFactor, 2);
    }
    
    return Math.min(baseDelay, 5000); // Cap at 5 seconds
  }

  private async getCurrentLoad(key: string): Promise<number> {
    try {
      const stats = await this.getSystemStats();
      return Math.max(
        stats.cpuLoad,
        stats.memoryLoad,
        stats.queueLoad
      );
    } catch (error) {
      logger.error('Error getting system load', { error: (error as Error).message });
      return 0;
    }
  }

  private initializeRedis(): void {
    this.redis = new RedisClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retry_strategy: (options) => {
        if (options.error?.code === 'ECONNREFUSED') {
          return new Error('Redis server refused connection');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.redis.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
      this.metrics.incrementCounter('redis_connection_errors');
    });
  }

  private startLoadMonitoring(): void {
    setInterval(async () => {
      const loadMetrics = await this.getSystemMetrics();
      this.updateThrottlingRules(loadMetrics);
    }, 10000); // Check every 10 seconds
  }

  private async updateThrottlingRules(metrics: SystemMetrics): Promise<void> {
    if (!this.dynamicThrottling.enabled) return;

    const predictedLoad = this.predictLoad(metrics);
    if (predictedLoad > this.dynamicThrottling.loadThreshold) {
      this.defaultRules.maxRequests = Math.floor(
        this.defaultRules.maxRequests * this.dynamicThrottling.scaleDownFactor
      );
    } else if (predictedLoad < this.dynamicThrottling.loadThreshold * 0.5) {
      this.defaultRules.maxRequests = Math.min(
        Math.ceil(this.defaultRules.maxRequests * this.dynamicThrottling.scaleUpFactor),
        200 // Maximum allowed requests
      );
    }

    logger.info('Throttling rules updated', {
      predictedLoad,
      newMaxRequests: this.defaultRules.maxRequests
    });
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const metrics = await this.metrics.getRecentMetrics('1m');
    return {
      cpu: metrics.cpu.average,
      memory: metrics.memory.average,
      errorRate: metrics.errors.rate,
      responseTime: metrics.latency.p95
    };
  }

  // ... implement remaining methods
}
