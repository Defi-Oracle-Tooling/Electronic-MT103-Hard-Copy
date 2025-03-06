'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { PatternInsight } from '@/types/monitoring';
import { Line } from 'react-chartjs-2';

interface Props {
  metric: string;
  timeRange: string;
}

export default function PatternDetection({ metric, timeRange }: Props) {
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [sensitivity, setSensitivity] = useState(0.8);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const detectPatterns = async () => {
      const insights = await monitoring.detectPatterns(metric, timeRange, sensitivity);
      setPatterns(insights);
    };
    detectPatterns();
  }, [metric, timeRange, sensitivity]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pattern Detection</h3>
        <div className="flex items-center space-x-2">
          <label>Sensitivity:</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      <div className="space-y-4">
        {patterns.map((pattern, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold capitalize">{pattern.patternType}</h4>
            <p className="text-sm text-gray-600">{pattern.description}</p>
            <div className="mt-2 text-sm">
              <span className="font-medium">Strength: </span>
              <span className={`text-${pattern.strength > 0.7 ? 'green' : 'yellow'}-500`}>
                {(pattern.strength * 100).toFixed(1)}%
              </span>
            </div>
            {pattern.period && (
              <div className="text-sm">
                <span className="font-medium">Period: </span>
                {pattern.period} hours
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
