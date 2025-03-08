import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';

/**
 * Memory management service to monitor and optimize memory usage
 */
export class MemoryManagementService {
  private static instance: MemoryManagementService;
  private metrics: MetricsService;
  private checkInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastGcTime: number = 0;
  
  // Memory thresholds
  private readonly highWatermarkPercent = 85;
  private readonly mediumWatermarkPercent = 70;
  private readonly gcMinIntervalMs = 60000; // Minimum 60s between forced GC
  
  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.startMonitoring();
    
    // Register cleanup on process exit
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
  }

  public static getInstance(): MemoryManagementService {
    if (!MemoryManagementService.instance) {
      MemoryManagementService.instance = new MemoryManagementService();
    }
    return MemoryManagementService.instance;
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    // Check memory usage periodically
    this.checkInterval = setInterval(() => this.checkMemoryUsage(), 10000);
    
    // Schedule periodic memory cleanup to prevent fragmentation
    this.cleanupInterval = setInterval(() => this.periodicCleanup(), 300000);

    logger.info('Memory monitoring started');
  }

  /**
   * Check current memory usage and take action if needed
   */
  public checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    // Calculate usage ratio
    const heapUsed = memoryUsage.heapUsed;
    const heapTotal = memoryUsage.heapTotal;
    const heapUsageRatio = (heapUsed / heapTotal) * 100;
    
    // Record metrics
    this.metrics.setGauge('memory.heap_used', heapUsed);
    this.metrics.setGauge('memory.heap_total', heapTotal);
    this.metrics.setGauge('memory.rss', memoryUsage.rss);
    this.metrics.setGauge('memory.external', memoryUsage.external);
    this.metrics.setGauge('memory.usage_ratio', heapUsageRatio);

    // Take actions based on memory pressure
    if (heapUsageRatio > this.highWatermarkPercent) {
      // Critical: Aggressive memory reduction needed
      this.handleHighMemoryPressure(heapUsed, heapTotal);
    } else if (heapUsageRatio > this.mediumWatermarkPercent) {
      // Warning: Prepare for potential memory issues
      this.handleMediumMemoryPressure(heapUsed, heapTotal);
    }
  }

  /**
   * Handle high memory pressure situation
   */
  private handleHighMemoryPressure(heapUsed: number, heapTotal: number): void {
    logger.warn('High memory pressure detected', {
      heapUsed: this.formatBytes(heapUsed),
      heapTotal: this.formatBytes(heapTotal),
      usageRatio: (heapUsed / heapTotal * 100).toFixed(2) + '%'
    });
    
    this.metrics.incrementCounter('memory.high_pressure_events');
    
    // Force garbage collection if available and enough time passed since last GC
    const now = Date.now();
    if (global.gc && now - this.lastGcTime > this.gcMinIntervalMs) {
      logger.info('Forcing garbage collection');
      global.gc();
      this.lastGcTime = now;
    }

    // Take additional emergency actions
    this.clearCaches();
  }

  /**
   * Handle medium memory pressure situation
   */
  private handleMediumMemoryPressure(heapUsed: number, heapTotal: number): void {
    logger.info('Medium memory pressure detected', {
      heapUsed: this.formatBytes(heapUsed),
      heapTotal: this.formatBytes(heapTotal),
      usageRatio: (heapUsed / heapTotal * 100).toFixed(2) + '%'
    });
    
    this.metrics.incrementCounter('memory.medium_pressure_events');
    
    // Perform light cleanup operations
    this.trimCaches();
  }

  /**
   * Perform periodic memory cleanup operations
   */
  private periodicCleanup(): void {
    const memBefore = process.memoryUsage().heapUsed;
    
    // Clear weak caches and perform cleanup
    this.trimCaches();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      this.lastGcTime = Date.now();
      
      const memAfter = process.memoryUsage().heapUsed;
      const freed = memBefore - memAfter;
      
      if (freed > 0) {
        logger.info('Memory cleanup freed memory', {
          freedBytes: this.formatBytes(freed)
        });
      }
    }
  }

  /**
   * Clear in-memory caches to reduce memory pressure
   */
  private clearCaches(): void {
    try {
      // Get global cache registry (would need to be implemented elsewhere)
      const globalCacheRegistry = (global as any).__cacheRegistry || {};
      
      // Clear registered caches
      Object.values(globalCacheRegistry).forEach((cache: any) => {
        if (cache && typeof cache.clear === 'function') {
          cache.clear();
        }
      });

      logger.info('All in-memory caches cleared');
    } catch (error) {
      logger.error('Error clearing caches', { error: (error as Error).message });
    }
  }

  /**
   * Trim in-memory caches to reduce memory pressure
   */
  private trimCaches(): void {
    try {
      // Get global cache registry (would need to be implemented elsewhere)
      const globalCacheRegistry = (global as any).__cacheRegistry || {};
      
      // Trim registered caches
      Object.values(globalCacheRegistry).forEach((cache: any) => {
        if (cache && typeof cache.trim === 'function') {
          cache.trim(0.5); // Try to reduce size by 50%
        }
      });

      logger.info('In-memory caches trimmed');
    } catch (error) {
      logger.error('Error trimming caches', { error: (error as Error).message });
    }
  }

  /**
   * Format bytes to a human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Clean up resources when shutting down
   */
  private cleanup(): void {
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    logger.info('Memory management service shutting down');
  }

  /**
   * Manual trigger for garbage collection (if available)
   */
  public forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      this.lastGcTime = Date.now();
      logger.info('Manual garbage collection triggered');
      return true;
    }
    
    logger.warn('Garbage collection not available. Run Node with --expose-gc flag.');
    return false;
  }

  /**
   * Get current memory status
   */
  public getMemoryStatus(): Record<string, any> {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: this.formatBytes(memoryUsage.heapUsed),
      heapTotal: this.formatBytes(memoryUsage.heapTotal),
      rss: this.formatBytes(memoryUsage.rss),
      external: this.formatBytes(memoryUsage.external),
      usageRatio: (memoryUsage.heapUsed / memoryUsage.heapTotal * 100).toFixed(2) + '%',
      timestamp: new Date().toISOString()
    };
  }
}
