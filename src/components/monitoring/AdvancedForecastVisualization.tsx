'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { MonitoringService } from '@/services/monitoring.service';
import type { ForecastVisualizationOptions, MetricForecast } from '@/types/monitoring';

interface Props {
  metric: string;
  horizon: string;
}

export default function AdvancedForecastVisualization({ metric, horizon }: Props) {
  const [forecast, setForecast] = useState<MetricForecast & { decomposition?: Record<string, number[]> }>();
  const [options, setOptions] = useState<ForecastVisualizationOptions>({
    showConfidenceBands: true,
    showSeasonalPatterns: true,
    overlayHistorical: true,
    decomposition: {
      trend: true,
      seasonal: true,
      residual: false
    },
    annotations: {
      events: true,
      changePoints: true,
      anomalies: true
    }
  });
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const loadForecast = async () => {
      const data = await monitoring.getForecastVisualization(metric, horizon, options);
      setForecast(data);
    };
    loadForecast();
  }, [metric, horizon, options]);

  if (!forecast) return <div>Loading forecast...</div>;

  const datasets = [
    {
      label: 'Actual',
      data: forecast.decomposition?.historical || [],
      borderColor: 'rgb(75, 192, 192)',
      fill: false
    },
    {
      label: 'Forecast',
      data: forecast.decomposition?.forecast || [],
      borderColor: 'rgb(255, 159, 64)',
      borderDash: [5, 5],
      fill: false
    },
    ...(options.showConfidenceBands ? [
      {
        label: 'Upper Bound',
        data: forecast.confidence?.upper || [],
        borderColor: 'rgba(255, 159, 64, 0.2)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: '+1'
      },
      {
        label: 'Lower Bound',
        data: forecast.confidence?.lower || [],
        borderColor: 'rgba(255, 159, 64, 0.2)',
        fill: false
      }
    ] : [])
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Advanced Forecast Analysis</h3>
        <div className="flex gap-2">
          {Object.entries(options.decomposition).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={e => setOptions(prev => ({
                  ...prev,
                  decomposition: {
                    ...prev.decomposition,
                    [key]: e.target.checked
                  }
                }))}
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </div>

      <Line
        data={{
          labels: forecast.decomposition?.timestamps || [],
          datasets
        }}
        options={{
          responsive: true,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y?.toFixed(2) || '';
                  return `${label}: ${value}`;
                }
              }
            },
            legend: {
              position: 'top'
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour'
              }
            }
          }
        }}
      />
    </div>
  );
}
