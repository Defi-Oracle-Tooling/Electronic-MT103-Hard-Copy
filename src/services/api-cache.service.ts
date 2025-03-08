import { RedisClient } from 'redis';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';

export interface CacheConfig {
  ttl: number;  // Time-to-live in seconds
  keyPrefix: string;
  maxSize?: number; // Maximum size in bytes
  skipCache?: boolean; // For bypassing cache in certain scenarios
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number; // Estimated size in bytes
  avgHitTime: number; // Average time to retrieve from cache in ms
  avgMissTime: number; // Average time to retrieve from source in ms
}

export class ApiCacheService {
  private static instance: ApiCacheService;
  private readonly redis: RedisClient;
  private readonly metricsService: MetricsService;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setAsync: (key: string, value: string, mode: string, duration: number) => Promise<unknown>;
  private readonly delAsync: (key: string) => Promise<number>;
  private readonly keysAsync: (pattern: string) => Promise<string[]>;
  private readonly defaultConfig: CacheConfig = {
    ttl: 300, // 5 minutes default
    keyPrefix: 'api:',
    maxSize: 1024 * 1024 * 50, // 50MB default
  };
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    size: 0,
    avgHitTime: 0,
    avgMissTime: 0
  };

  private constructor() {
    this.redis = new RedisClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection refused, retrying...');
          return 5000; // Retry after 5 seconds
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retries reached');
          return new Error('Redis max retries reached');
        }
        return Math.min(options.attempt * 100, 3000); // Exponential backoff with cap
      }
    });

    // Promisify Redis methods
    this.getAsync = promisify(this.redis.get).bind(this.redis);
    this.setAsync = promisify(this.redis.set).bind(this.redis);
    this.delAsync = promisify(this.redis.del).bind(this.redis);
    this.keysAsync = promisify(this.redis.keys).bind(this.redis);
    
    this.metricsService = MetricsService.getInstance();
    
    // Log errors but don't crash
    this.redis.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
      this.metricsService.incrementCounter('redis_errors');
    });
    
    // Log when connection is established
    this.redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    // Set up periodic cache maintenance
    setInterval(this.cleanupCache.bind(this), 60000); // Every minute
    
    // Report stats periodically
    setInterval(this.reportStats.bind(this), 300000); // Every 5 minutes
  }

  public static getInstance(): ApiCacheService {
    if (!ApiCacheService.instance) {
      ApiCacheService.instance = new ApiCacheService();
    }
    return ApiCacheService.instance;
  }

  /**
   * Generate a hash key for caching based on the request details
   */
  private generateCacheKey(endpoint: string, params: Record<string, any> = {}, config: CacheConfig): string {
    // Sort params to ensure consistent keys regardless of object property order
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    // Create a hash from endpoint and params
    const hash = createHash('md5')
      .update(`${endpoint}${JSON.stringify(sortedParams)}`)
      .digest('hex');
    
    return `${config.keyPrefix}${hash}`;
  }

  /**
   * Get data from cache or fetch from source if not available
   */
  public async cacheOrFetch<T>(
    endpoint: string, 
    fetchFn: () => Promise<T>, 
    params: Record<string, any> = {},
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    // Skip cache if specified
    if (mergedConfig.skipCache) {
      return await fetchFn();
    }
    
    const key = this.generateCacheKey(endpoint, params, mergedConfig);
    const startTime = performance.now();
    
    try {
      // Try to get from cache first
      const cachedData = await this.getAsync(key);
      
      if (cachedData) {
        // Cache hit
        const hitTime = performance.now() - startTime;
        this.stats.hits++;
        this.stats.avgHitTime = (this.stats.avgHitTime * (this.stats.hits - 1) + hitTime) / this.stats.hits;
        this.metricsService.incrementCounter('cache_hits');
        this.metricsService.recordHistogram('cache_hit_time', hitTime);
        
        return JSON.parse(cachedData) as T;
      }
      
      // Cache miss, fetch fresh data
      const fetchStart = performance.now();
      const data = await fetchFn();
      const missTime = performance.now() - fetchStart;
      
      // Store in cache
      const serialized = JSON.stringify(data);
      await this.setAsync(key, serialized, 'EX', mergedConfig.ttl);
      
      // Update stats
      this.stats.misses++;
      this.stats.avgMissTime = (this.stats.avgMissTime * (this.stats.misses - 1) + missTime) / this.stats.misses;
      this.stats.size += serialized.length;
      this.metricsService.incrementCounter('cache_misses');
      this.metricsService.recordHistogram('cache_miss_time', missTime);
      
      return data;
    } catch (error) {
      logger.error('Cache operation failed', { 
        endpoint, 
        error: (error as Error).message 
      });
      this.metricsService.incrementCounter('cache_errors');
      
      // Fallback to direct fetch on cache error
      return await fetchFn();
    }
  }

  /**
   * Invalidate cache for a specific endpoint/params combination
   */
  public async invalidateCache(
    endpoint: string, 
    params: Record<string, any> = {},
    config?: Partial<CacheConfig>
  ): Promise<void> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const key = this.generateCacheKey(endpoint, params, mergedConfig);
    
    try {
      await this.delAsync(key);
      logger.info('Cache invalidated', { endpoint });
      this.metricsService.incrementCounter('cache_invalidations');
    } catch (error) {
      logger.error('Failed to invalidate cache', {
        endpoint,
        error: (error as Error).message
      });
    }
  }

  /**
   * Invalidate all cache entries for a specific endpoint
   */
  public async invalidateCacheByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keysAsync(`${this.defaultConfig.keyPrefix}${pattern}*`);
      if (keys.length === 0) return;
      
      // Delete keys in batches to avoid blocking Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map(key => this.delAsync(key)));
      }
      
      logger.info('Cache pattern invalidated', { 
        pattern,
        keysRemoved: keys.length
      });
      this.metricsService.incrementCounter('cache_pattern_invalidations');
    } catch (error) {
      logger.error('Failed to invalidate cache by pattern', {
        pattern,
        error: (error as Error).message
      });
    }
  }

  /**
   * Periodic cache maintenance to prevent unbounded growth
   */
  private async cleanupCache(): Promise<void> {
    try {
      // Estimate total cache size
      const keys = await this.keysAsync(`${this.defaultConfig.keyPrefix}*`);
      this.stats.keys = keys.length;
      
      // Check if we need cleanup (over maxSize)
      if (this.stats.size > this.defaultConfig.maxSize!) {
        logger.info('Running cache cleanup due to size limit', { 
          currentSize: this.stats.size,
          maxSize: this.defaultConfig.maxSize,
          keysCount: keys.length
        });
        
        // Delete oldest 25% of keys (simple LRU approximation)
        const keysToRemove = Math.ceil(keys.length * 0.25);
        if (keysToRemove > 0) {
          // We would ideally check TTL for this, but for simplicity just removing a percentage
          const keysToDelete = keys.slice(0, keysToRemove);
          await Promise.all(keysToDelete.map(key => this.delAsync(key)));
          
          // Reset size estimate (will be recalculated on next cache operations)
          this.stats.size = 0;
        }
      }
    } catch (error) {
      logger.error('Cache cleanup failed', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Report cache statistics
   */
  private reportStats(): void {
    logger.info('Cache statistics', { 
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    });
    
    // Update metrics
    this.metricsService.setGauge('cache_keys_count', this.stats.keys);
    this.metricsService.setGauge('cache_size_bytes', this.stats.size);
    this.metricsService.setGauge('cache_hit_rate', 
      this.stats.hits / (this.stats.hits + this.stats.misses || 1));
  }
  
  /**
   * Get current cache statistics
   */
  public getCacheStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Clear all cache entries
   */
  public async clearCache(): Promise<void> {
    try {
      const keys = await this.keysAsync(`${this.defaultConfig.keyPrefix}*`);
      if (keys.length === 0) return;
      
      await Promise.all(keys.map(key => this.delAsync(key)));
      
      // Reset stats
      this.stats.size = 0;
      this.stats.keys = 0;
      
      logger.info('Cache cleared', { keysRemoved: keys.length });
      this.metricsService.incrementCounter('cache_clear_operations');
    } catch (error) {
      logger.error('Failed to clear cache', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Cleanup on service shutdown
   */
  public shutdown(): void {
    this.redis.quit();
  }
}
