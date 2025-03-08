import { Metrics } from './metrics';
import { logger } from '../utils/logger';

export class ConsolidatedMetrics {
    private readonly metrics: Metrics;

    constructor() {
        this.metrics = new Metrics();
        this.setupMetricsCollection();
    }

    private setupMetricsCollection(): void {
        this.collectTranslationMetrics();
        this.collectPerformanceMetrics();
        this.collectComplianceMetrics();
        this.collectSecurityMetrics();
    }

    private async collectTranslationMetrics(): Promise<void> {
        setInterval(async () => {
            const metrics = await this.gatherTranslationStats();
            await this.metrics.publish('translation', metrics);
        }, 60000);
    }

    private async collectComplianceMetrics(): Promise<void> {
        setInterval(async () => {
            const metrics = await this.gatherComplianceStats();
            await this.metrics.publish('compliance', metrics);
        }, 300000);
    }

    private async gatherTranslationStats() {
        return {
            totalTranslations: await this.metrics.getCounter('translations.total'),
            successRate: await this.metrics.getGauge('translations.success_rate'),
            averageLatency: await this.metrics.getHistogram('translations.latency'),
            qualityScores: await this.metrics.getHistogram('translations.quality'),
            providerStats: await this.getProviderStats()
        };
    }
}
