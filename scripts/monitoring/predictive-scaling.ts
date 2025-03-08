import { MachineLearningService } from '@/services/ml.service';
import { MetricsService } from '@/services/metrics.service';
import { KubernetesService } from '@/services/kubernetes.service';

export class PredictiveScaling {
  private readonly mlService: MachineLearningService;
  private readonly metricsService: MetricsService;
  private readonly k8sService: KubernetesService;

  constructor() {
    this.mlService = new MachineLearningService();
    this.metricsService = new MetricsService();
    this.k8sService = new KubernetesService();
  }

  async predictLoad(timeWindow: number = 3600): Promise<number> {
    const metrics = await this.metricsService.getHistoricalMetrics(timeWindow);
    return this.mlService.predictLoadPattern(metrics);
  }

  async adjustResources(predictedLoad: number): Promise<void> {
    const resources = await this.calculateRequiredResources(predictedLoad);
    await this.k8sService.scaleDeployment('mt103-system', resources);
  }

  private async calculateRequiredResources(load: number): Promise<ResourceRequirements> {
    // Advanced resource calculation logic
    return {
      cpu: Math.ceil(load * 0.2),
      memory: Math.ceil(load * 512),
      replicas: Math.max(2, Math.ceil(load / 1000))
    };
  }
}
