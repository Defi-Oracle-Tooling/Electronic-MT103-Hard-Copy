import { MetricDataPoint, SystemMetrics } from '../types/metrics';
import { logger } from '../utils/logger';
import { PrometheusClient } from '../lib/prometheus';

export class MetricsService {
  private static instance: MetricsService;
  private prometheusClient: PrometheusClient;

  private constructor() {
    this.prometheusClient = new PrometheusClient();
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  async recordMetric(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.prometheusClient.gauge(name).set(labels, value);
      logger.debug({ metric: name, value, labels }, 'Metric recorded');
    } catch (error) {
      logger.error({ err: error, metric: name }, 'Failed to record metric');
    }
  }

  async incrementCounter(name: string, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.prometheusClient.counter(name).inc(labels);
    } catch (error) {
      logger.error({ err: error, metric: name }, 'Failed to increment counter');
    }
  }

  async decrementCounter(name: string, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.prometheusClient.counter(name).dec(labels);
    } catch (error) {
      logger.error({ err: error, metric: name }, 'Failed to decrement counter');
    }
  }

  async recordHistogram(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.prometheusClient.histogram(name).observe(labels, value);
    } catch (error) {
      logger.error({ err: error, metric: name, value }, 'Failed to record histogram');
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
      latency: await this.getAverageLatency(),
      errorRate: await this.getErrorRate(),
      requestRate: await this.getRequestRate()
    };
  }

  // Implementation details for metric collection methods...
}
