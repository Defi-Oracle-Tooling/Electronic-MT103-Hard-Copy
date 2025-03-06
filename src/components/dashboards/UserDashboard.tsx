'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@/types/auth';

interface DashboardMetrics {
  transactionCount: number;
  pendingApprovals: number;
  recentAlerts: Array<{ id: string; message: string; severity: string }>;
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const user = session?.user as User;

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/user/metrics');
      const data = await response.json();
      setMetrics(data);
    };

    if (session) {
      fetchMetrics();
    }
  }, [session]);

  if (!metrics) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {user.organizationType} User
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Transactions Today</h3>
          <p className="text-2xl">{metrics.transactionCount}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Pending Approvals</h3>
          <p className="text-2xl">{metrics.pendingApprovals}</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Recent Alerts</h3>
          <ul>
            {metrics.recentAlerts.map(alert => (
              <li key={alert.id} className={`text-${alert.severity}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
