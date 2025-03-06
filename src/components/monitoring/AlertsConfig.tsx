'use client';

import { useState, useEffect } from 'react';
import { MonitoringService } from '@/services/monitoring.service';
import type { AlertConfig } from '@/types/monitoring';

export default function AlertsConfig() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch('/api/monitoring/alerts/config');
      const data = await response.json();
      setAlerts(data);
    };
    fetchAlerts();
  }, []);

  const handleThresholdUpdate = async (id: string, threshold: number) => {
    try {
      await monitoring.setAlert(id, threshold);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, threshold } : alert
      ));
      setEditing(null);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Alert Configuration</h2>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{alert.name}</h3>
                <p className="text-sm text-gray-500">{alert.metric}</p>
              </div>
              <div className="flex items-center space-x-2">
                {editing === alert.id ? (
                  <input
                    type="number"
                    defaultValue={alert.threshold}
                    onBlur={e => handleThresholdUpdate(alert.id, Number(e.target.value))}
                    className="w-24 border rounded px-2"
                  />
                ) : (
                  <span>{alert.threshold}</span>
                )}
                <button
                  onClick={() => setEditing(editing === alert.id ? null : alert.id)}
                  className="text-blue-500"
                >
                  {editing === alert.id ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
