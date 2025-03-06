'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { PredictiveInsight } from '@/types/monitoring';

export default function PredictiveInsights() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [selectedMetrics] = useState(['cpu_usage', 'memory_usage', 'transaction_latency']);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchInsights = async () => {
      const results = await monitoring.getPredictiveInsights(selectedMetrics, '7d');
      setInsights(results);
    };
    fetchInsights();
    const interval = setInterval(fetchInsights, 900000); // 15 minutes
    return () => clearInterval(interval);
  }, [selectedMetrics]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Predictive Insights</h3>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              insight.businessImpact.severity === 'high' ? 'border-red-500 bg-red-50' :
              insight.businessImpact.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{insight.metric}</h4>
                <p className="text-sm text-gray-600">
                  Impact: {insight.businessImpact.category} ({insight.businessImpact.severity})
                </p>
              </div>
              <span className="text-sm font-medium">
                {(insight.probability * 100).toFixed()}% probability
              </span>
            </div>

            <p className="mt-2 text-sm">{insight.businessImpact.details}</p>

            {insight.relatedIndicators.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium">Related Indicators:</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {insight.relatedIndicators.map((indicator, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-blue-100 rounded-full"
                      title={`Correlation: ${(indicator.correlation * 100).toFixed()}%`}
                    >
                      {indicator.metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
