'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { MetricCorrelation } from '@/types/monitoring';
import { Line } from 'react-chartjs-2';

export default function CorrelationAnalysis() {
  const [correlations, setCorrelations] = useState<MetricCorrelation[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    if (selectedMetrics.length >= 2) {
      const analyzeCorrelations = async () => {
        const results = await monitoring.analyzeCorrelations(selectedMetrics, '24h');
        setCorrelations(results);
      };
      analyzeCorrelations();
    }
  }, [selectedMetrics]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Metric Correlation Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {correlations.map(correlation => (
          <div key={`${correlation.sourceMetric}-${correlation.targetMetric}`} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">
              {correlation.sourceMetric} ⟷ {correlation.targetMetric}
            </h3>
            <div className="space-y-2">
              <p>Correlation Score: {correlation.correlationScore.toFixed(2)}</p>
              <p>Relationship: {correlation.relationship}</p>
              <p>Confidence: {(correlation.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
