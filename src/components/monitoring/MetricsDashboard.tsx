'use client';

import RealTimeMetrics from './RealTimeMetrics';
import type { ChartOptions } from '@/types/monitoring';

export default function MetricsDashboard() {
  const metrics: Array<{ name: string; options: ChartOptions }> = [
    {
      name: 'cpu_usage',
      options: {
        title: 'CPU Usage',
        type: 'line',
        showLegend: true,
        thresholds: {
          warning: 70,
          critical: 90
        }
      }
    },
    {
      name: 'transaction_throughput',
      options: {
        title: 'Transaction Throughput',
        type: 'bar',
        stacked: true
      }
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">System Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map(metric => (
          <RealTimeMetrics
            key={metric.name}
            metricName={metric.name}
            options={metric.options}
          />
        ))}
      </div>
    </div>
  );
}
