'use client';

import { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { MonitoringService } from '@/services/monitoring.service';
import type { MetricDataPoint, ChartOptions } from '@/types/monitoring';

interface MetricStreamProps {
  metricName: string;
  options: ChartOptions;
  refreshInterval?: number;
}

export default function RealTimeMetrics({ metricName, options, refreshInterval = 5000 }: MetricStreamProps) {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const monitoring = MonitoringService.getInstance();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initial data load
    const loadInitialData = async () => {
      const metrics = await monitoring.getPerformanceMetrics(
        metricName,
        '1h',
        'raw'
      );
      setData(metrics);
    };

    loadInitialData();

    // Setup WebSocket for real-time updates
    wsRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/metrics`);
    wsRef.current.onmessage = (event) => {
      const newMetric = JSON.parse(event.data);
      if (newMetric.name === metricName) {
        setData(prev => [...prev.slice(-60), newMetric]);
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [metricName]);

  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [{
      label: options.title,
      data: data.map(d => d.value),
      borderColor: 'rgb(75, 192, 192)',
      fill: options.type === 'area',
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: options.showLegend,
      },
      annotation: options.thresholds ? {
        annotations: {
          warning: {
            type: 'line',
            yMin: options.thresholds.warning,
            yMax: options.thresholds.warning,
            borderColor: 'orange',
            borderWidth: 2,
          },
          critical: {
            type: 'line',
            yMin: options.thresholds.critical,
            yMax: options.thresholds.critical,
            borderColor: 'red',
            borderWidth: 2,
          }
        }
      } : undefined
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{options.title}</h3>
      {options.type === 'bar' ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  );
}
