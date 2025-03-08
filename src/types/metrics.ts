export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  errorRate: number;
  requestRate: number;
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

export interface BaselineStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  seasonalFactors?: number[];
}

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}
