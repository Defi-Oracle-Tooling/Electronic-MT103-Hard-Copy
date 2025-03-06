'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { MonitoringService } from '@/services/monitoring.service';
import type { MetricForecast } from '@/types/monitoring';

interface Props {
  metric: string;
  horizon: string;
  confidence?: number;
}

export default function MetricForecast({ metric, horizon, confidence = 0.95 }: Props) {
  const [forecast, setForecast] = useState<MetricForecast[]>([]);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchForecast = async () => {
      const data = await monitoring.getMetricForecast(metric, horizon, confidence);
      setForecast(data);
    };
    fetchForecast();
  }, [metric, horizon, confidence]);

  const chartData = {
    labels: forecast.map(f => new Date(f.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Forecast',
        data: forecast.map(f => f.predicted),
        borderColor: 'rgb(75, 192, 192)',
        fill: false
      },
      {
        label: 'Upper Bound',
        data: forecast.map(f => f.confidence.upper),
        borderColor: 'rgba(75, 192, 192, 0.3)',
        fill: false,
        borderDash: [5, 5]
      },
      {
        label: 'Lower Bound',
        data: forecast.map(f => f.confidence.lower),
        borderColor: 'rgba(75, 192, 192, 0.3)',
        fill: false,
        borderDash: [5, 5]
      }
    ]
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Metric Forecast</h3>
      <Line 
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${metric} Forecast (${confidence * 100}% CI)`
            }
          }
        }}
      />
    </div>
  );
}
