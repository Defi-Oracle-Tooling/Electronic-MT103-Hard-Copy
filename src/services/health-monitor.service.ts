import { HealthCheckResult, ResourceUtilization, ServiceStatus } from '../types/monitoring';
import { MetricsService } from './metrics.service';
import { logger } from '../utils/logger';
import { CacheManager } from './cache-manager.service';
import { RedisClient } from '../lib/redis';

export class HealthMonitorService {
  private static instance: HealthMonitorService;
  private metricsService: MetricsService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly services: Map<string, ServiceStatus>;

  private constructor() {
    this.metricsService = MetricsService.getInstance();
    this.services = new Map();
    this.startMonitoring();
  }

  static getInstance(): HealthMonitorService {
    if (!HealthMonitorService.instance) {
      HealthMonitorService.instance = new HealthMonitorService();
    }
    return HealthMonitorService.instance;
  }

  async checkHealth(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const startTime = performance.now();

    try {
      // Check database
      results.push(await this.checkDatabase());
      // Check Redis
      results.push(await this.checkRedis());
      // Check API dependencies
      results.push(await this.checkExternalAPIs());
      // Check system resources
      const resources = await this.getResourceUtilization();
      results.push(this.evaluateResources(resources));

      // Record check duration
      const duration = performance.now() - startTime;
      this.metricsService.recordHistogram('health_check_duration_ms', duration);

    } catch (error) {
      logger.error({ error }, 'Health check failed');
      this.metricsService.incrementCounter('health_check_failures');
    }

    return results;
  }

  private async getResourceUtilization(): Promise<ResourceUtilization> {
    const metrics = await this.metricsService.getSystemMetrics();
    return {
      cpu: {
        usage: metrics.cpuUsage,
        cores: require('os').cpus().length,
        load: require('os').loadavg(),
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        free: require('os').freemem(),
        total: require('os').totalmem(),
        swapUsage: 0 // Implement based on OS
      },
      disk: {
        used: 0, // Implement disk metrics
        free: 0,
        total: 0,
        iops: 0
      }
    };
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(async () => {
      const health = await this.checkHealth();
      this.updateServiceStatus(health);
    }, 60000); // Check every minute
  }

  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
