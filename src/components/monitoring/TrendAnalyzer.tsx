'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { MonitoringService } from '@/services/monitoring.service';
import type { TrendAnalysis } from '@/types/monitoring';

interface Props {
  metric: string;
  period: string;
}

export default function TrendAnalyzer({ metric, period }: Props) {
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [options, setOptions] = useState({
    decompose: true,
    detectBreakpoints: true
  });
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const analyzeTrends = async () => {
      const result = await monitoring.analyzeTrends(metric, period, options);
      setAnalysis(result);
    };
    analyzeTrends();
  }, [metric, period, options]);

  if (!analysis) return <div>Analyzing trends...</div>;

  const chartData = {
    labels: analysis.projections.map(p => new Date(p.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Actual Trend',
        data: analysis.trends.map(t => t.endValue),
        borderColor: 'rgb(75, 192, 192)',
        fill: false
      },
      {
        label: 'Projection',
        data: analysis.projections.map(p => p.value),
        borderColor: 'rgb(255, 159, 64)',
        borderDash: [5, 5],
        fill: false
      },
      {
        label: 'Confidence Range',
        data: analysis.projections.map(p => p.range[1]),
        borderColor: 'rgba(255, 159, 64, 0.2)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: true
      }
    ]
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Trend Analysis</h3>
        <div className="space-x-4">
          {analysis.trends.map((trend, index) => (
            <span 
              key={index}
              className="text-sm px-2 py-1 bg-blue-100 rounded"
              title={`R² Score: ${trend.r2Score.toFixed(3)}`}
            >
              {trend.type} ({(trend.rate * 100).toFixed(1)}% change)
            </span>
          ))}
        </div>
      </div>

      <Line
        data={chartData}
        options={{
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: { unit: 'hour' }
            }
          },
          plugins: {
            annotation: {
              annotations: analysis.trends.map(trend => ({
                type: 'line',
                mode: 'vertical',
                scaleID: 'x',
                value: trend.breakpoints[0],
                borderColor: 'rgba(255, 99, 132, 0.5)',
                borderWidth: 2,
                label: {
                  content: 'Trend Change',
                  enabled: true
                }
              }))
            }
          }
        }}
      />
    </div>
  );
}
