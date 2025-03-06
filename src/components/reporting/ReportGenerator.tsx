'use client';

import { useState } from 'react';
import type { ReportConfig } from '@/types/monitoring';

export default function ReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'transaction',
    period: 'daily',
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${config.type}-${config.period}.${config.format}`;
        a.click();
      }
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Report Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label>Report Type</label>
          <select
            value={config.type}
            onChange={e => setConfig(prev => ({ ...prev, type: e.target.value as ReportConfig['type'] }))}
            className="mt-1 block w-full rounded-md border-gray-300"
          >
            <option value="transaction">Transaction Report</option>
            <option value="audit">Audit Report</option>
            <option value="compliance">Compliance Report</option>
          </select>
        </div>

        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}
