import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';
import { EventEmitter } from 'events';

export class DbPoolManager extends EventEmitter {
  private static instance: DbPoolManager;
  private pools: Map<string, Pool> = new Map();
  private metrics: MetricsService;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.metrics = MetricsService.getInstance();
    this.startHealthChecks();
  }

  public static getInstance(): DbPoolManager {
    if (!DbPoolManager.instance) {
      DbPoolManager.instance = new DbPoolManager();
    }
    return DbPoolManager.instance;
  }

  public getPool(name: string = 'default'): Pool {
    if (!this.pools.has(name)) {
      throw new Error(`Pool ${name} does not exist`);
    }
    return this.pools.get(name)!;
  }

  public async createPool(config: PoolConfig, name: string = 'default'): Promise<Pool> {
    if (this.pools.has(name)) {
      return this.pools.get(name)!;
    }

    const pool = new Pool({
      ...config,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    });

    // Monitor pool events
    pool.on('connect', this.handleConnect.bind(this, name));
    pool.on('error', this.handleError.bind(this, name));
    pool.on('acquire', this.handleAcquire.bind(this, name));
    pool.on('remove', this.handleRemove.bind(this, name));

    this.pools.set(name, pool);
    return pool;
  }

  private handleConnect(poolName: string, client: any): void {
    this.metrics.incrementCounter(`db_pool.${poolName}.connections`);
    
    // Monitor query execution time
    const originalQuery = client.query;
    client.query = async (...args: any[]) => {
      const start = process.hrtime.bigint();
      try {
        const result = await originalQuery.apply(client, args);
        const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
        this.metrics.recordHistogram(`db_pool.${poolName}.query_time`, duration);
        return result;
      } catch (error) {
        this.metrics.incrementCounter(`db_pool.${poolName}.query_errors`);
        throw error;
      }
    };
  }

  private async checkPoolHealth(): Promise<void> {
    for (const [name, pool] of this.pools.entries()) {
      try {
        const { totalCount, idleCount, waitingCount } = await pool.poolState();
        
        this.metrics.setGauge(`db_pool.${name}.total`, totalCount);
        this.metrics.setGauge(`db_pool.${name}.idle`, idleCount);
        this.metrics.setGauge(`db_pool.${name}.waiting`, waitingCount);
        
        // Auto-scale pool if needed
        await this.adjustPoolSize(name, pool, { totalCount, waitingCount });
      } catch (error) {
        logger.error(`Pool health check failed for ${name}`, {
          error: (error as Error).message
        });
      }
    }
  }

  private async adjustPoolSize(name: string, pool: Pool, stats: PoolStats): Promise<void> {
    const config = pool.options;
    const currentMax = config.max || 10;
    
    if (stats.waitingCount > 0 && currentMax < 50) {
      // Increase pool size if there are waiting clients
      const newMax = Math.min(currentMax + 5, 50);
      await this.resizePool(name, newMax);
    } else if (stats.idleCount > 5 && currentMax > 10) {
      // Decrease pool size if there are too many idle connections
      const newMax = Math.max(currentMax - 2, 10);
      await this.resizePool(name, newMax);
    }
  }

  // Event handlers and monitoring methods...
}
