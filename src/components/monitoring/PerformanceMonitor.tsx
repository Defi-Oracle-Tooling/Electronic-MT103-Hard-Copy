'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { PerformanceMetric } from '@/types/monitoring';
import { Line } from 'react-chartjs-2';
import { debounce } from 'lodash-es';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const monitoring = useMemo(() => MonitoringService.getInstance(), []);
  
  // Real-time updates via WebSocket
  const wsEndpoint = `/api/monitoring/metrics/stream?timeframe=${timeframe}`;
  const { lastMessage, connectionStatus } = useWebSocket<PerformanceMetric>(wsEndpoint);
  
  // Update metrics when a new websocket message is received
  useEffect(() => {
    if (lastMessage) {
      setMetrics(currentMetrics => {
        // Keep metrics array at reasonable size by removing oldest when adding new
        const newMetrics = [...currentMetrics, lastMessage];
        if (newMetrics.length > 100) {
          return newMetrics.slice(-100);
        }
        return newMetrics;
      });
    }
  }, [lastMessage]);
  
  // Fetch initial data and set up polling fallback if WebSocket fails
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await monitoring.getTransactionMetrics(timeframe);
        setMetrics(data.recentTransactions);
        setError(null);
      } catch (err) {
        setError('Failed to load metrics');
        console.error('Error fetching metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    
    // Fallback polling if WebSocket is disconnected
    let interval: NodeJS.Timeout | null = null;
    if (connectionStatus !== 'Connected') {
      interval = setInterval(fetchMetrics, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [monitoring, timeframe, connectionStatus]);
  
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => ({
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Transaction Count',
        data: metrics.map(m => m.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Error Count',
        data: metrics.map(m => m.errorCount),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Average Response Time (ms)',
        data: metrics.map(m => m.avgResponseTime),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
        fill: false,
        yAxisID: 'responseTime'
      }
    ]
  }), [metrics]);
  
  // Memoize chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return '';
            const index = items[0].dataIndex;
            return metrics[index] ? new Date(metrics[index].timestamp).toLocaleString() : '';
          }
        }
      },
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Count'
        }
      },
      responseTime: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Response Time (ms)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    animation: {
      duration: 0 // Disable animations for better performance
    }
  }), [metrics]);
  
  // Use debounce to prevent excessive API calls when changing timeframe
  const handleTimeframeChange = useCallback(debounce((value: string) => {
    setTimeframe(value);
  }, 500), []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Performance Metrics</h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            connectionStatus === 'Connected' ? 'bg-green-500' : 
            connectionStatus === 'Connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600 mr-4">{connectionStatus}</span>
          
          <select
            defaultValue={timeframe}
            onChange={e => handleTimeframeChange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading && metrics.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            {error}
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
