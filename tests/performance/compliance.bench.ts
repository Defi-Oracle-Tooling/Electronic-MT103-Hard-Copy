import autocannon from 'autocannon';
import { ComplianceService } from '@/services/compliance/compliance.service';

describe('Compliance Performance Tests', () => {
  test('should handle high volume of compliance checks', async () => {
    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/validate',
      connections: 100,
      duration: 30,
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: 'MT103-PERF-TEST',
        amount: 50000,
        type: 'CROSS_BORDER'
      })
    });

    const results = await instance;
    
    expect(results.errors).toBe(0);
    expect(results.timeouts).toBe(0);
    expect(results.latency.p99).toBeLessThan(200);
    expect(results.requests.average).toBeGreaterThan(1000);
  });

  test('should maintain performance under concurrent report generation', async () => {
    const startTime = Date.now();
    const reports = await Promise.all(
      Array(50).fill(0).map(() => 
        new ComplianceService().generateComplianceReport({
          type: 'ADHOC',
          detailed: true
        })
      )
    );
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
    expect(reports).toHaveLength(50);
    reports.forEach(report => {
      expect(report.status).toBe('completed');
    });
  });
});
