import { MetricsService } from './metrics.service';
import { logger } from '../utils/logger';
import { MemoryManagementService } from './memory-management.service';
import { DatabaseOptimizationService } from './database-optimization.service';

export class AutoTuningService {
  private static instance: AutoTuningService;
  private metrics: MetricsService;
  private memory: MemoryManagementService;
  private dbOptimizer: DatabaseOptimizationService;
  
  private readonly tuningParams = {
    poolSize: { min: 5, max: 50, current: 10 },
    cacheSize: { min: '512m', max: '4g', current: '1g' },
    queryTimeout: { min: 1000, max: 30000, current: 5000 }
  };

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.memory = MemoryManagementService.getInstance();
    this.dbOptimizer = DatabaseOptimizationService.getInstance();
    this.startTuningCycle();
  }

  private async startTuningCycle(): Promise<void> {
    setInterval(async () => {
      const load = await this.analyzeSystemLoad();
      await this.adjustParameters(load);
    }, 300000); // Every 5 minutes
  }

  private async analyzeSystemLoad(): Promise<{ cpu: number; memory: number; latency: number }> {
    const metrics = await this.metrics.getRecentMetrics('5m');
    
    return {
      cpu: this.calculatePercentile(metrics.cpu, 95),
      memory: this.calculatePercentile(metrics.memory, 95),
      latency: this.calculatePercentile(metrics.latency, 95)
    };
  }

  private async adjustParameters(load: { cpu: number; memory: number; latency: number }): Promise<void> {
    // Adjust connection pool size based on load
    if (load.cpu > 80 || load.latency > 1000) {
      this.tuningParams.poolSize.current = Math.min(
        this.tuningParams.poolSize.current + 5,
        this.tuningParams.poolSize.max
      );
    } else if (load.cpu < 30 && load.latency < 100) {
      this.tuningParams.poolSize.current = Math.max(
        this.tuningParams.poolSize.current - 2,
        this.tuningParams.poolSize.min
      );
    }

    // Adjust cache size based on memory usage
    if (load.memory > 85) {
      const currentSize = parseInt(this.tuningParams.cacheSize.current);
      this.tuningParams.cacheSize.current = `${Math.max(currentSize / 2, 512)}m`;
      await this.memory.forceGarbageCollection();
    }

    // Log adjustments
    logger.info('Auto-tuning parameters adjusted', {
      newPoolSize: this.tuningParams.poolSize.current,
      newCacheSize: this.tuningParams.cacheSize.current,
      load
    });
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // ... implement remaining methods
}
