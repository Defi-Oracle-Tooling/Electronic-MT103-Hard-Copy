'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/types/compliance';

export default function ComplianceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch('/api/compliance/alerts');
      const data = await response.json();
      setAlerts(data);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-4 rounded-lg border-l-4 border-${alert.severity}-500`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{alert.title}</h3>
              <p className="text-sm text-gray-600">{alert.description}</p>
            </div>
            <span className={`text-${alert.severity}-500 text-sm font-medium`}>
              {alert.severity.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 text-sm">
            <p>Regulation: {alert.regulation}</p>
            <p>Due Date: {new Date(alert.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
