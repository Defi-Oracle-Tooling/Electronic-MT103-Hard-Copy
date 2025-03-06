'use client';

import { useState } from 'react';
import RealTimeAnomalyScore from './RealTimeAnomalyScore';
import AdvancedForecastVisualization from './AdvancedForecastVisualization';
import PatternDetection from './PatternDetection';
import MetricCorrelation from './CorrelationAnalysis';

interface MetricConfig {
  name: string;
  displayName: string;
  category: 'performance' | 'business' | 'system';
  defaultThresholds: {
    warning: number;
    critical: number;
  };
}

export default function IntegratedMetricsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<string>('cpu_usage');
  const [timeRange, setTimeRange] = useState<string>('24h');

  const metrics: MetricConfig[] = [
    {
      name: 'cpu_usage',
      displayName: 'CPU Usage',
      category: 'system',
      defaultThresholds: { warning: 70, critical: 90 }
    },
    {
      name: 'transaction_latency',
      displayName: 'Transaction Latency',
      category: 'performance',
      defaultThresholds: { warning: 1000, critical: 2000 }
    },
    {
      name: 'error_rate',
      displayName: 'Error Rate',
      category: 'performance',
      defaultThresholds: { warning: 0.05, critical: 0.1 }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {metrics.map(metric => (
              <option key={metric.name} value={metric.name}>
                {metric.displayName}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <RealTimeAnomalyScore
          metric={selectedMetric}
          lookbackWindow={timeRange}
        />
        <AdvancedForecastVisualization
          metric={selectedMetric}
          horizon={timeRange}
        />
        <PatternDetection
          metric={selectedMetric}
          timeRange={timeRange}
        />
        <MetricCorrelation />
      </div>
    </div>
  );
}
