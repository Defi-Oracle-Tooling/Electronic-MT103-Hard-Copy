import { EventEmitter } from 'events';
import { MetricsService } from './metrics.service';
import { logger } from '../utils/logger';

interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: number;
  nextAttempt: number;
}

export class CircuitBreaker extends EventEmitter {
  private static instance: CircuitBreaker;
  private readonly circuits: Map<string, CircuitState>;
  private metrics: MetricsService;
  private readonly threshold: number;
  private readonly resetTimeout: number;

  private constructor() {
    super();
    this.circuits = new Map();
    this.metrics = MetricsService.getInstance();
    this.threshold = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10);
    this.resetTimeout = parseInt(process.env.CIRCUIT_BREAKER_RESET_MS || '30000', 10);
  }

  static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getCircuit(circuitName);

    if (circuit.state === 'OPEN') {
      if (Date.now() < circuit.nextAttempt) {
        this.metrics.incrementCounter('circuit_breaker_rejections', { circuit: circuitName });
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit ${circuitName} is OPEN`);
      }
      circuit.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.handleSuccess(circuitName);
      return result;
    } catch (error) {
      return this.handleFailure(circuitName, error, fallback);
    }
  }

  private getCircuit(name: string): CircuitState {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0
      });
    }
    return this.circuits.get(name)!;
  }

  private handleSuccess(name: string): void {
    const circuit = this.getCircuit(name);
    circuit.failures = 0;
    circuit.state = 'CLOSED';
    
    this.metrics.recordMetric(`circuit_${name}_status`, 0);
    this.emit('success', { circuit: name });
  }

  private async handleFailure<T>(
    name: string,
    error: Error,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getCircuit(name);
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= this.threshold) {
      circuit.state = 'OPEN';
      circuit.nextAttempt = Date.now() + this.resetTimeout;
      
      this.metrics.recordMetric(`circuit_${name}_status`, 1);
      this.emit('open', { circuit: name, failures: circuit.failures });
      
      logger.warn({
        circuit: name,
        failures: circuit.failures,
        nextAttempt: new Date(circuit.nextAttempt)
      }, 'Circuit breaker opened');
    }

    if (fallback) {
      return fallback();
    }
    throw error;
  }
}
