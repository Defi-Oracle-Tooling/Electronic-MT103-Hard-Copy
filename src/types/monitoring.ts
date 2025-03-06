export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    messageQueue: 'up' | 'down';
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    requestLatency: number;
  };
  lastChecked: Date;
}

export interface TransactionMetrics {
  totalVolume: number;
  successRate: number;
  averageProcessingTime: number;
  peakThroughput: number;
  errorDistribution: Record<string, number>;
  recentTransactions: {
    timestamp: Date;
    count: number;
    errorCount: number;
  }[];
}

export interface ReportConfig {
  type: 'transaction' | 'audit' | 'compliance';
  period: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'csv' | 'json';
  filters?: Record<string, any>;
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertConfig {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '==' | '>=' | '<=';
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: ('email' | 'sms' | 'slack')[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface MetricVisualization {
  type: 'line' | 'bar' | 'gauge';
  metric: string;
  timeRange: string;
  aggregation: 'avg' | 'sum' | 'max' | 'min';
  groupBy?: string[];
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface ChartOptions {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  showLegend?: boolean;
  stacked?: boolean;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export interface LiveMetricStream {
  metricName: string;
  interval: number;
  aggregation: 'raw' | 'avg' | 'sum' | 'max' | 'min';
  retention: '1h' | '24h' | '7d' | '30d';
}

export interface AnomalyConfig {
  metric: string;
  algorithm: 'zscore' | 'mad' | 'iqr' | 'dbscan';
  sensitivity: number;
  trainingPeriod: '24h' | '7d' | '30d';
  minDataPoints: number;
}

export interface AnomalyDetectionResult {
  timestamp: Date;
  value: number;
  isAnomaly: boolean;
  score: number;
  bounds: {
    upper: number;
    lower: number;
  };
}

export interface MetricCorrelation {
  sourceMetric: string;
  targetMetric: string;
  correlationScore: number;
  timeOffset: number;
  confidence: number;
  relationship: 'direct' | 'inverse' | 'lagging' | 'leading';
}

export interface AdvancedChartOptions extends ChartOptions {
  annotations?: {
    markers: Array<{
      timestamp: Date;
      label: string;
      color: string;
    }>;
    ranges: Array<{
      start: Date;
      end: Date;
      label: string;
      color: string;
    }>;
  };
  forecast?: {
    enabled: boolean;
    horizon: '1h' | '24h' | '7d';
    confidenceInterval: number;
  };
}

export interface MetricForecast {
  timestamp: Date;
  predicted: number;
  confidence: {
    upper: number;
    lower: number;
  };
}

export interface HeatmapConfig {
  metrics: string[];
  timeRange: string;
  resolution: '1m' | '5m' | '1h';
  colorScale: 'linear' | 'logarithmic';
}

export interface TimeSeriesPattern {
  type: 'trend' | 'seasonal' | 'spike' | 'dip';
  startTime: Date;
  endTime: Date;
  confidence: number;
  magnitude: number;
}

export interface PatternInsight {
  patternType: 'seasonality' | 'trend' | 'cyclic' | 'outlier';
  strength: number;
  period?: number;
  description: string;
  significance: number;
  relatedMetrics: string[];
}

export interface AnomalyInsight {
  anomalyId: string;
  metric: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  relatedEvents: Array<{
    metric: string;
    timestamp: Date;
    value: number;
  }>;
  suggestedActions: string[];
}

export interface MetricRelationship {
  sourceMetric: string;
  targetMetric: string;
  relationshipType: 'causal' | 'correlative' | 'seasonal';
  strength: number;
  lagTime: number;
  confidence: number;
  evidence: Array<{
    timestamp: Date;
    sourceDelta: number;
    targetDelta: number;
  }>;
}

export interface RootCauseAnalysis {
  eventId: string;
  primaryMetric: string;
  timestamp: Date;
  impactScore: number;
  causes: Array<{
    metric: string;
    confidence: number;
    evidence: string;
    timeline: Array<{
      timestamp: Date;
      value: number;
      significance: number;
    }>;
  }>;
  recommendations: string[];
}

export interface PredictiveModel {
  metricName: string;
  algorithm: 'prophet' | 'arima' | 'lstm';
  features: string[];
  historicalAccuracy: number;
  lastTrainingDate: Date;
  predictionHorizon: string;
}

export interface ThresholdPrediction {
  metric: string;
  predictedBreachTime: Date;
  confidence: number;
  currentTrend: number;
  timeToThreshold: number;
  suggestedActions: string[];
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  trends: Array<{
    type: 'linear' | 'exponential' | 'cyclical';
    startValue: number;
    endValue: number;
    rate: number;
    r2Score: number; // Goodness of fit
    breakpoints: Date[];
    seasonality?: {
      period: number;
      amplitude: number;
      phase: number;
    };
  }>;
  projections: Array<{
    timestamp: Date;
    value: number;
    range: [number, number]; // Confidence interval
  }>;
}

export interface PredictiveInsight {
  metric: string;
  probability: number;
  timeFrame: {
    start: Date;
    end: Date;
  };
  impactScore: number;
  relatedIndicators: Array<{
    metric: string;
    correlation: number;
    contribution: number;
  }>;
  businessImpact: {
    category: 'performance' | 'reliability' | 'cost' | 'security';
    severity: 'low' | 'medium' | 'high';
    details: string;
  };
}

export interface RealTimeAnomalyScore {
  timestamp: Date;
  metric: string;
  currentValue: number;
  anomalyScore: number;
  zScore: number;
  rollingStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  seasonalityImpact: number;
  contextualFactors: Array<{
    factor: string;
    impact: number;
  }>;
}

export interface ForecastVisualizationOptions {
  showConfidenceBands: boolean;
  showSeasonalPatterns: boolean;
  overlayHistorical: boolean;
  decomposition: {
    trend: boolean;
    seasonal: boolean;
    residual: boolean;
  };
  annotations: {
    events: boolean;
    changePoints: boolean;
    anomalies: boolean;
  };
}
