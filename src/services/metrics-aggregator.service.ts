import { MetricsService } from './metrics.service';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export class MetricsAggregator extends EventEmitter {
  private static instance: MetricsAggregator;
  private metrics: MetricsService;
  private aggregationWindow = 60000; // 1 minute
  private retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
  private metricsBuckets: Map<string, any[]> = new Map();

  private constructor() {
    super();
    this.metrics = MetricsService.getInstance();
    this.startAggregation();
  }

  private startAggregation(): void {
    setInterval(() => this.aggregateMetrics(), this.aggregationWindow);
    setInterval(() => this.cleanupOldMetrics(), this.retentionPeriod);
  }

  private async aggregateMetrics(): Promise<void> {
    const currentTime = Date.now();
    const window = this.aggregationWindow;

    for (const [metricName, values] of this.metricsBuckets) {
      // Filter values within current window
      const recentValues = values.filter(v => 
        currentTime - v.timestamp < window
      );

      if (recentValues.length > 0) {
        this.calculateAggregates(metricName, recentValues);
      }
    }
  }

  private calculateAggregates(metricName: string, values: any[]): void {
    const numericValues = values.map(v => v.value).filter(v => !isNaN(v));
    
    if (numericValues.length === 0) return;

    // Calculate basic statistics
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate standard deviation
    const squareDiffs = numericValues.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numericValues.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Record aggregated metrics
    this.metrics.setGauge(`${metricName}_avg`, avg);
    this.metrics.setGauge(`${metricName}_median`, median);
    this.metrics.setGauge(`${metricName}_stddev`, stdDev);
    this.metrics.setGauge(`${metricName}_min`, sorted[0]);
    this.metrics.setGauge(`${metricName}_max`, sorted[sorted.length - 1]);
    
    // Detect anomalies using z-score
    const zScoreThreshold = 3;
    const anomalies = numericValues.filter(value => 
      Math.abs((value - avg) / stdDev) > zScoreThreshold
    );
    
    if (anomalies.length > 0) {
      logger.warn(`Anomalies detected in ${metricName}`, {
        anomalies,
        avg,
        stdDev
      });
    }
  }
}
