'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { SystemHealth } from '@/types/monitoring';

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchHealth = async () => {
      const data = await monitoring.getSystemHealth();
      setHealth(data);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!health) return <div>Loading system health...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">System Health</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg shadow bg-${health.status === 'healthy' ? 'green' : 'red'}-100`}>
          <h3>Overall Status</h3>
          <p className="text-2xl capitalize">{health.status}</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Service Status</h3>
          <ul className="space-y-2">
            {Object.entries(health.services).map(([service, status]) => (
              <li key={service} className="flex justify-between">
                <span className="capitalize">{service}</span>
                <span className={`text-${status === 'up' ? 'green' : 'red'}-500`}>
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Performance Metrics</h3>
          <ul className="space-y-2">
            <li>CPU Usage: {health.metrics.cpuUsage}%</li>
            <li>Memory Usage: {health.metrics.memoryUsage}%</li>
            <li>Active Connections: {health.metrics.activeConnections}</li>
            <li>Request Latency: {health.metrics.requestLatency}ms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
