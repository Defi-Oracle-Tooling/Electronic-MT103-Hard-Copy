'use client';

import { useState, useEffect } from 'react';
import type { ComplianceRule } from '@/types/audit';

export default function ComplianceMonitor() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<Array<{
    ruleId: string;
    count: number;
    lastOccurrence: Date;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [rulesResponse, violationsResponse] = await Promise.all([
        fetch('/api/compliance/rules'),
        fetch('/api/compliance/violations')
      ]);
      
      setRules(await rulesResponse.json());
      setViolations(await violationsResponse.json());
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Compliance Monitoring</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Active Rules</h3>
          <ul className="space-y-2">
            {rules.filter(r => r.isActive).map(rule => (
              <li key={rule.id} className="flex justify-between">
                <span>{rule.name}</span>
                <span className={`text-${rule.severity.toLowerCase()}-500`}>
                  {rule.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Recent Violations</h3>
          <ul className="space-y-2">
            {violations.map(v => (
              <li key={v.ruleId} className="flex justify-between">
                <span>{rules.find(r => r.id === v.ruleId)?.name}</span>
                <span className="text-red-500">{v.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
