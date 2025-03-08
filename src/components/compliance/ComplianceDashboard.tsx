'use client';

import { useEffect, useState } from 'react';
import { ComplianceMetrics } from '@/types/compliance';
import { ComplianceChart } from './ComplianceChart';
import { AuditTrail } from './AuditTrail';
import { RegulatoryCalendar } from './RegulatoryCalendar';

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/compliance/metrics');
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading compliance metrics...</div>;
  if (!metrics) return <div>Error loading compliance data</div>;

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      <div className="col-span-8">
        <ComplianceChart data={metrics.trends} />
      </div>
      <div className="col-span-4">
        <RegulatoryCalendar events={metrics.upcomingDeadlines} />
      </div>
      <div className="col-span-12">
        <AuditTrail records={metrics.recentAudits} />
      </div>
    </div>
  );
}
