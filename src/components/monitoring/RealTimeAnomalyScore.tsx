'use client';

import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { MonitoringService } from '@/services/monitoring.service';
import type { RealTimeAnomalyScore } from '@/types/monitoring';

interface Props {
  metric: string;
  lookbackWindow?: string;
}

export default function RealTimeAnomalyScore({ metric, lookbackWindow = '1h' }: Props) {
  const [scores, setScores] = useState<RealTimeAnomalyScore[]>([]);
  const [latestScore, setLatestScore] = useState<RealTimeAnomalyScore | null>(null);
  const monitoring = MonitoringService.getInstance();
  const wsRef = useRef<() => void>();

  useEffect(() => {
    const loadInitialData = async () => {
      const initialScore = await monitoring.getRealTimeAnomalyScore(metric, lookbackWindow);
      setLatestScore(initialScore);
    };

    loadInitialData();

    // Subscribe to real-time updates
    wsRef.current = monitoring.subscribeToAnomalyScores(metric, (newScore) => {
      setLatestScore(newScore);
      setScores(prev => [...prev.slice(-60), newScore]);
    });

    return () => wsRef.current?.();
  }, [metric, lookbackWindow]);

  const getSeverityColor = (score: number) => {
    if (score > 0.8) return 'rgb(239, 68, 68)';
    if (score > 0.6) return 'rgb(234, 179, 8)';
    return 'rgb(34, 197, 94)';
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Real-Time Anomaly Detection</h3>
        {latestScore && (
          <div className="text-right">
            <div 
              className="text-2xl font-bold"
              style={{ color: getSeverityColor(latestScore.anomalyScore) }}
            >
              {(latestScore.anomalyScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Anomaly Score</div>
          </div>
        )}
      </div>

      {latestScore && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-sm">
            <div className="text-gray-500">Z-Score</div>
            <div>{latestScore.zScore.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">Current Value</div>
            <div>{latestScore.currentValue.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">Rolling Mean</div>
            <div>{latestScore.rollingStats.mean.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">Std Dev</div>
            <div>{latestScore.rollingStats.stdDev.toFixed(2)}</div>
          </div>
        </div>
      )}

      <Line
        data={{
          labels: scores.map(s => new Date(s.timestamp).toLocaleTimeString()),
          datasets: [
            {
              label: 'Anomaly Score',
              data: scores.map(s => s.anomalyScore),
              borderColor: 'rgb(234, 179, 8)',
              fill: false
            },
            {
              label: 'Normalized Value',
              data: scores.map(s => (s.currentValue - s.rollingStats.mean) / s.rollingStats.stdDev),
              borderColor: 'rgb(59, 130, 246)',
              fill: false
            }
          ]
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }}
      />
    </div>
  );
}
