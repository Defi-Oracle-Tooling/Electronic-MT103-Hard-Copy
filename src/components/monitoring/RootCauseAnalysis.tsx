'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { RootCauseAnalysis } from '@/types/monitoring';
import { Line } from 'react-chartjs-2';

interface Props {
  eventId: string;
  metric: string;
  timeRange: string;
}

export default function RootCauseAnalysis({ eventId, metric, timeRange }: Props) {
  const [analysis, setAnalysis] = useState<RootCauseAnalysis | null>(null);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const analyzeEvent = async () => {
      const result = await monitoring.analyzeRootCause(eventId, metric, timeRange);
      setAnalysis(result);
    };
    analyzeEvent();
  }, [eventId, metric, timeRange]);

  if (!analysis) return <div>Analyzing root cause...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Root Cause Analysis</h3>

      <div className="space-y-6">
        <div className="border-l-4 border-red-500 pl-4">
          <p className="text-sm text-gray-600">Impact Score: {analysis.impactScore.toFixed(2)}</p>
          <p className="font-medium">Primary Metric: {analysis.primaryMetric}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Potential Causes</h4>
          <div className="space-y-4">
            {analysis.causes.map((cause, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{cause.metric}</span>
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                    {(cause.confidence * 100).toFixed()}% confidence
                  </span>
                </div>
                <p className="text-sm mt-2">{cause.evidence}</p>
                <Line
                  data={{
                    labels: cause.timeline.map(t => new Date(t.timestamp).toLocaleTimeString()),
                    datasets: [{
                      label: 'Value',
                      data: cause.timeline.map(t => t.value),
                      borderColor: 'rgb(75, 192, 192)',
                    }]
                  }}
                  options={{ maintainAspectRatio: false, height: 100 }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Recommendations</h4>
          <ul className="list-disc list-inside space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-sm">{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
