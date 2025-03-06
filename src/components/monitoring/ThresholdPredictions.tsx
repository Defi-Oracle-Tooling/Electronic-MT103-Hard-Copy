'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { ThresholdPrediction } from '@/types/monitoring';

export default function ThresholdPredictions() {
  const [predictions, setPredictions] = useState<ThresholdPrediction[]>([]);
  const [selectedMetrics] = useState(['cpu_usage', 'memory_usage', 'response_time']);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchPredictions = async () => {
      const results = await monitoring.getThresholdPredictions(selectedMetrics, '24h');
      setPredictions(results);
    };
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [selectedMetrics]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Threshold Breach Predictions</h3>
      
      <div className="space-y-4">
        {predictions.map(prediction => (
          <div 
            key={prediction.metric}
            className={`p-4 rounded border-l-4 ${
              prediction.timeToThreshold < 3600000 ? 'border-red-500 bg-red-50' : 
              prediction.timeToThreshold < 7200000 ? 'border-yellow-500 bg-yellow-50' : 
              'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{prediction.metric}</h4>
                <p className="text-sm text-gray-600">
                  Predicted breach: {new Date(prediction.predictedBreachTime).toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-medium">
                {Math.round(prediction.confidence * 100)}% confident
              </span>
            </div>

            <div className="mt-2">
              <p className="text-sm">Current trend: {prediction.currentTrend > 0 ? '↑' : '↓'} {Math.abs(prediction.currentTrend).toFixed(2)}/hr</p>
              <p className="text-sm font-medium mt-2">Suggested Actions:</p>
              <ul className="text-sm list-disc list-inside mt-1">
                {prediction.suggestedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
