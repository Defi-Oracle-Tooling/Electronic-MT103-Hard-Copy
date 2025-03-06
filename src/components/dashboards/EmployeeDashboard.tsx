'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@/types/auth';

interface WorkflowMetrics {
  pendingTasks: number;
  activeWorkflows: number;
  teamPerformance: number;
  recentDocuments: Array<{ id: string; name: string; status: string }>;
}

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const user = session?.user as User;

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/employee/workflow-metrics');
      const data = await response.json();
      setMetrics(data);
    };

    if (session) {
      fetchMetrics();
    }
  }, [session]);

  if (!metrics) return <div>Loading dashboard...</div>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Pending Tasks</h3>
          <p className="text-2xl">{metrics.pendingTasks}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Active Workflows</h3>
          <p className="text-2xl">{metrics.activeWorkflows}</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3>Recent Documents</h3>
          <ul className="mt-2">
            {metrics.recentDocuments.map(doc => (
              <li key={doc.id} className="flex justify-between items-center">
                <span>{doc.name}</span>
                <span className={`text-sm text-${doc.status === 'approved' ? 'green' : 'yellow'}-500`}>
                  {doc.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
