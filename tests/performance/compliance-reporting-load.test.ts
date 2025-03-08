import autocannon from 'autocannon';

describe('Compliance Reporting Load Tests', () => {
  test('should handle month-end batch report generation', async () => {
    const reports = [
      { type: 'AML_SUMMARY', priority: 1 },
      { type: 'TRANSACTION_MONITORING', priority: 1 },
      { type: 'SUSPICIOUS_ACTIVITY', priority: 2 },
      { type: 'REGULATORY_FILING', priority: 1 }
    ];

    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/reports/batch',
      connections: 50,
      duration: 120,
      requests: reports.map(report => ({
        method: 'POST',
        path: '/generate',
        headers: { 
          'content-type': 'application/json',
          'x-report-priority': report.priority.toString()
        },
        body: JSON.stringify({ type: report.type })
      }))
    });

    const results = await instance;
    expect(results.latency.p99).toBeLessThan(5000); // 5s for 99th percentile
    expect(results.throughput.total).toBeGreaterThan(1000); // Minimum 1K reports
  });
});
