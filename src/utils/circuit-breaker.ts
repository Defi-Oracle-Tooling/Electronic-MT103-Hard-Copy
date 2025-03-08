import { EventEmitter } from 'events';
import { logger } from './logger';
import { MetricsService } from '../services/metrics.service';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRetries: number;
  monitorInterval: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenSuccesses: number = 0;
  private metrics: MetricsService;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRetries: 3,
      monitorInterval: 10000
    }
  ) {
    super();
    this.metrics = MetricsService.getInstance();
    this.startMonitoring();
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldRetry()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure(error as Error);
      throw error;
    }
  }

  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.metrics.setGauge('circuit_breaker_state', this.getStateMetric());
      this.metrics.setGauge('circuit_breaker_failures', this.failures);
    }, this.options.monitorInterval);
  }

  private getStateMetric(): number {
    switch (this.state) {
      case CircuitState.CLOSED: return 0;
      case CircuitState.HALF_OPEN: return 1;
      case CircuitState.OPEN: return 2;
      default: return -1;
    }
  }

  // Additional helper methods...
}
