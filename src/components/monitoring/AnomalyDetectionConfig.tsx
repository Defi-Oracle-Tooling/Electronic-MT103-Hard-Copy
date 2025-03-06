'use client';

import { useState } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { AnomalyConfig } from '@/types/monitoring';

export default function AnomalyDetectionConfig() {
  const [config, setConfig] = useState<AnomalyConfig>({
    metric: '',
    algorithm: 'zscore',
    sensitivity: 2.0,
    trainingPeriod: '7d',
    minDataPoints: 100
  });

  const monitoring = MonitoringService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await monitoring.configureAnomalyDetection(config);
    } catch (error) {
      console.error('Failed to configure anomaly detection:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Anomaly Detection Configuration</h2>
      
      <div>
        <label className="block mb-2">Metric</label>
        <input
          type="text"
          value={config.metric}
          onChange={e => setConfig(prev => ({ ...prev, metric: e.target.value }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label className="block mb-2">Algorithm</label>
        <select
          value={config.algorithm}
          onChange={e => setConfig(prev => ({ ...prev, algorithm: e.target.value as AnomalyConfig['algorithm'] }))}
          className="w-full border rounded px-2 py-1"
        >
          <option value="zscore">Z-Score</option>
          <option value="mad">Median Absolute Deviation</option>
          <option value="iqr">Interquartile Range</option>
          <option value="dbscan">DBSCAN Clustering</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save Configuration
      </button>
    </form>
  );
}
