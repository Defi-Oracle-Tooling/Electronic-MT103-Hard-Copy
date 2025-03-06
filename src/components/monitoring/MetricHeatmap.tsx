'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { HeatmapConfig } from '@/types/monitoring';

export default function MetricHeatmap() {
  const [data, setData] = useState<Record<string, number[][]>>({});
  const [config, setConfig] = useState<HeatmapConfig>({
    metrics: ['cpu_usage', 'memory_usage', 'request_latency'],
    timeRange: '24h',
    resolution: '5m',
    colorScale: 'linear'
  });

  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchHeatmapData = async () => {
      const heatmapData = await monitoring.getMetricHeatmap(config);
      setData(heatmapData);
    };
    fetchHeatmapData();
  }, [config]);

  const getColor = (value: number, max: number) => {
    const intensity = config.colorScale === 'linear' 
      ? value / max
      : Math.log(value + 1) / Math.log(max + 1);
    return `rgb(0, ${Math.round(intensity * 255)}, 0)`;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Metric Correlation Heatmap</h3>
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(data).map(([metric, values]) => {
          const max = Math.max(...values.flat());
          return (
            <div key={metric} className="relative">
              <div className="grid grid-cols-24 gap-px bg-gray-200">
                {values.map((row, i) => (
                  row.map((value, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="h-8"
                      style={{ backgroundColor: getColor(value, max) }}
                      title={`${value.toFixed(2)} at ${i}:${j.toString().padStart(2, '0')}`}
                    />
                  ))
                ))}
              </div>
              <span className="absolute left-0 -top-6">{metric}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
