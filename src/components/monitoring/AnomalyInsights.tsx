'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { AnomalyInsight } from '@/types/monitoring';

interface Props {
  anomalyId: string;
}

export default function AnomalyInsights({ anomalyId }: Props) {
  const [insight, setInsight] = useState<AnomalyInsight | null>(null);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchInsight = async () => {
      const data = await monitoring.getAnomalyInsights(anomalyId);
      setInsight(data);
    };
    fetchInsight();
  }, [anomalyId]);

  if (!insight) return <div>Loading insights...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Anomaly Analysis</h3>
      
      <div className="space-y-4">
        <div className={`p-3 rounded bg-${insight.severity}-100`}>
          <span className="font-medium capitalize">{insight.severity} Severity</span>
          <p className="mt-1 text-sm">{insight.explanation}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Related Events</h4>
          <ul className="space-y-2">
            {insight.relatedEvents.map((event, index) => (
              <li key={index} className="text-sm flex justify-between">
                <span>{event.metric}</span>
                <span className="text-gray-600">
                  {event.value.toFixed(2)} at {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Recommended Actions</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {insight.suggestedActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
