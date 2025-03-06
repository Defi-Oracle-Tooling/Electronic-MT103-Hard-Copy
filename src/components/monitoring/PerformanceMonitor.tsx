'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { PerformanceMetric } from '@/types/monitoring';
import { Line } from 'react-chartjs-2';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await monitoring.getTransactionMetrics(timeframe);
      setMetrics(data.recentTransactions);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeframe]);

  const chartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Transaction Count',
        data: metrics.map(m => m.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Error Count',
        data: metrics.map(m => m.errorCount),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Performance Metrics</h2>
        <select
          value={timeframe}
          onChange={e => setTimeframe(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Line data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
}
