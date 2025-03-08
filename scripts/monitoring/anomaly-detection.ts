import { TensorFlowService } from '@/services/tensorflow.service';
import { AlertService } from '@/services/alert.service';
import { MetricsService } from '@/services/metrics.service';

export class AnomalyDetection {
  private readonly tfService: TensorFlowService;
  private readonly alertService: AlertService;
  private readonly metricsService: MetricsService;

  constructor() {
    this.tfService = new TensorFlowService();
    this.alertService = new AlertService();
    this.metricsService = new MetricsService();
  }

  async detectAnomalies(): Promise<void> {
    const metrics = await this.metricsService.getCurrentMetrics();
    const predictions = await this.tfService.predictAnomalies(metrics);
    
    if (predictions.anomalyScore > 0.8) {
      await this.alertService.triggerAlert({
        severity: 'high',
        type: 'anomaly',
        details: predictions.explanation,
        metrics: predictions.affectedMetrics
      });
    }
  }

  async trainModel(): Promise<void> {
    const historicalData = await this.metricsService.getHistoricalData();
    await this.tfService.trainAnomalyDetection(historicalData);
  }
}
