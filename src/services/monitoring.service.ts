import type { SystemHealth, TransactionMetrics } from '@/types/monitoring';

export class MonitoringService {
  private static instance: MonitoringService;
  private baseUrl: string = '/api/monitoring';

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('Failed to fetch system health');
    return response.json();
  }

  async getTransactionMetrics(timeframe: string): Promise<TransactionMetrics> {
    const response = await fetch(`${this.baseUrl}/transactions/metrics?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch transaction metrics');
    return response.json();
  }

  async setAlert(metric: string, threshold: number): Promise<void> {
    await fetch(`${this.baseUrl}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, threshold }),
    });
  }

  async getAlertConfigs(): Promise<AlertConfig[]> {
    const response = await fetch(`${this.baseUrl}/alerts/config`);
    if (!response.ok) throw new Error('Failed to fetch alert configs');
    return response.json();
  }

  async updateAlertConfig(id: string, config: Partial<AlertConfig>): Promise<void> {
    await fetch(`${this.baseUrl}/alerts/config/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async getPerformanceMetrics(
    metric: string,
    timeRange: string,
    aggregation: string
  ): Promise<PerformanceMetric[]> {
    const params = new URLSearchParams({ metric, timeRange, aggregation });
    const response = await fetch(`${this.baseUrl}/metrics/performance?${params}`);
    if (!response.ok) throw new Error('Failed to fetch performance metrics');
    return response.json();
  }

  async subscribeToMetric(metricName: string, callback: (data: MetricDataPoint) => void): Promise<() => void> {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/metrics/${metricName}`);
    
    ws.onmessage = (event) => {
      callback(JSON.parse(event.data));
    };

    return () => ws.close();
  }

  async getMetricAggregation(
    metricName: string,
    timeRange: string,
    aggregation: 'avg' | 'sum' | 'max' | 'min'
  ): Promise<number> {
    const params = new URLSearchParams({ timeRange, aggregation });
    const response = await fetch(`${this.baseUrl}/metrics/${metricName}/aggregate?${params}`);
    if (!response.ok) throw new Error('Failed to fetch metric aggregation');
    const data = await response.json();
    return data.value;
  }

  async setMetricAlert(
    metricName: string, 
    threshold: number,
    condition: '>' | '<' | '=' | '>=' | '<='
  ): Promise<void> {
    await fetch(`${this.baseUrl}/metrics/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metricName, threshold, condition }),
    });
  }

  async configureAnomalyDetection(config: AnomalyConfig): Promise<void> {
    await fetch(`${this.baseUrl}/anomaly/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async getAnomalies(
    metric: string,
    timeRange: string
  ): Promise<AnomalyDetectionResult[]> {
    const params = new URLSearchParams({ metric, timeRange });
    const response = await fetch(`${this.baseUrl}/anomaly/results?${params}`);
    if (!response.ok) throw new Error('Failed to fetch anomalies');
    return response.json();
  }

  async analyzeCorrelations(
    metrics: string[],
    timeRange: string
  ): Promise<MetricCorrelation[]> {
    const response = await fetch(`${this.baseUrl}/metrics/correlations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, timeRange }),
    });
    if (!response.ok) throw new Error('Failed to analyze correlations');
    return response.json();
  }

  async getMetricForecast(
    metric: string,
    horizon: string,
    confidence: number = 0.95
  ): Promise<MetricForecast[]> {
    const params = new URLSearchParams({ metric, horizon, confidence: confidence.toString() });
    const response = await fetch(`${this.baseUrl}/metrics/forecast?${params}`);
    if (!response.ok) throw new Error('Failed to fetch forecast');
    return response.json();
  }

  async findPatterns(
    metric: string,
    timeRange: string
  ): Promise<TimeSeriesPattern[]> {
    const params = new URLSearchParams({ metric, timeRange });
    const response = await fetch(`${this.baseUrl}/metrics/patterns?${params}`);
    if (!response.ok) throw new Error('Failed to find patterns');
    return response.json();
  }

  async getMetricHeatmap(config: HeatmapConfig): Promise<Record<string, number[][]>> {
    const response = await fetch(`${this.baseUrl}/metrics/heatmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to generate heatmap');
    return response.json();
  }

  async detectPatterns(
    metric: string,
    timeRange: string,
    sensitivity: number = 0.8
  ): Promise<PatternInsight[]> {
    const params = new URLSearchParams({ metric, timeRange, sensitivity: sensitivity.toString() });
    const response = await fetch(`${this.baseUrl}/metrics/patterns/insights?${params}`);
    if (!response.ok) throw new Error('Failed to detect patterns');
    return response.json();
  }

  async getAnomalyInsights(
    anomalyId: string
  ): Promise<AnomalyInsight> {
    const response = await fetch(`${this.baseUrl}/anomaly/${anomalyId}/insights`);
    if (!response.ok) throw new Error('Failed to fetch anomaly insights');
    return response.json();
  }

  async analyzeMetricRelationships(
    metrics: string[],
    timeRange: string
  ): Promise<MetricRelationship[]> {
    const response = await fetch(`${this.baseUrl}/metrics/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, timeRange }),
    });
    if (!response.ok) throw new Error('Failed to analyze relationships');
    return response.json();
  }

  async analyzeRootCause(
    eventId: string,
    metric: string,
    timeRange: string
  ): Promise<RootCauseAnalysis> {
    const params = new URLSearchParams({ metric, timeRange });
    const response = await fetch(`${this.baseUrl}/analysis/root-cause/${eventId}?${params}`);
    if (!response.ok) throw new Error('Failed to analyze root cause');
    return response.json();
  }

  async trainPredictiveModel(config: PredictiveModel): Promise<void> {
    await fetch(`${this.baseUrl}/models/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async getThresholdPredictions(
    metrics: string[],
    horizon: string
  ): Promise<ThresholdPrediction[]> {
    const params = new URLSearchParams({ horizon });
    const response = await fetch(`${this.baseUrl}/predictions/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    });
    if (!response.ok) throw new Error('Failed to get threshold predictions');
    return response.json();
  }

  async analyzeTrends(
    metric: string,
    period: string,
    options?: {
      decompose?: boolean;
      detectBreakpoints?: boolean;
    }
  ): Promise<TrendAnalysis> {
    const params = new URLSearchParams({ 
      metric, 
      period,
      ...options
    });
    const response = await fetch(`${this.baseUrl}/analysis/trends?${params}`);
    if (!response.ok) throw new Error('Failed to analyze trends');
    return response.json();
  }

  async getPredictiveInsights(
    metrics: string[],
    timeHorizon: string
  ): Promise<PredictiveInsight[]> {
    const response = await fetch(`${this.baseUrl}/analysis/predictive-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, timeHorizon }),
    });
    if (!response.ok) throw new Error('Failed to get predictive insights');
    return response.json();
  }

  async getRealTimeAnomalyScore(
    metric: string,
    lookbackWindow: string = '1h'
  ): Promise<RealTimeAnomalyScore> {
    const params = new URLSearchParams({ metric, lookbackWindow });
    const response = await fetch(`${this.baseUrl}/anomaly/realtime-score?${params}`);
    if (!response.ok) throw new Error('Failed to get real-time anomaly score');
    return response.json();
  }

  async subscribeToAnomalyScores(
    metric: string,
    callback: (score: RealTimeAnomalyScore) => void
  ): Promise<() => void> {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/anomaly-scores/${metric}`);
    ws.onmessage = (event) => {
      callback(JSON.parse(event.data));
    };
    return () => ws.close();
  }

  async getForecastVisualization(
    metric: string,
    horizon: string,
    options: ForecastVisualizationOptions
  ): Promise<MetricForecast & { decomposition?: Record<string, number[]> }> {
    const response = await fetch(`${this.baseUrl}/forecast/visualization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, horizon, options }),
    });
    if (!response.ok) throw new Error('Failed to get forecast visualization');
    return response.json();
  }
}
