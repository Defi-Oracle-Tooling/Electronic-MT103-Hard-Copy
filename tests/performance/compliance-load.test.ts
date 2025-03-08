import autocannon from 'autocannon';
import { ComplianceService } from '@/services/compliance/compliance.service';

describe('Compliance Load Testing', () => {
  test('should handle high-volume PSD2 SCA validations', async () => {
    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/psd2/sca',
      connections: 200,
      duration: 60,
      requests: [
        {
          method: 'POST',
          path: '/validate',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            transactionId: 'TEST-LOAD',
            amount: 50000,
            currency: 'EUR',
            riskLevel: 'HIGH'
          })
        }
      ]
    });

    const results = await instance;
    expect(results.latency.p99).toBeLessThan(300); // 99th percentile under 300ms
    expect(results.throughput.average).toBeGreaterThan(2000); // 2K+ requests/sec
  });

  test('should maintain GDPR compliance under heavy load', async () => {
    const results = await autocannon({
      url: 'http://localhost:3000/api/compliance/gdpr',
      workers: 4,
      connections: 100,
      duration: 30,
      pipelining: 5,
      requests: [
        {
          method: 'POST',
          path: '/consent/validate',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-user',
            purpose: 'payment-processing',
            dataCategories: ['transaction', 'personal']
          })
        }
      ]
    });

    expect(results.errors).toBe(0);
    expect(results.timeouts).toBe(0);
    expect(results.latency.mean).toBeLessThan(100);
  });

  test('should handle mixed compliance workload patterns', async () => {
    const workloadMix = [
      { type: 'AML_CHECK', weight: 0.4 },
      { type: 'SANCTIONS_SCREENING', weight: 0.3 },
      { type: 'REGULATORY_REPORTING', weight: 0.2 },
      { type: 'AUDIT_LOGGING', weight: 0.1 }
    ];

    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance',
      connections: 200,
      duration: 300,
      requests: workloadMix.map(mix => ({
        method: 'POST',
        path: `/${mix.type.toLowerCase()}`,
        probability: mix.weight,
        headers: { 'content-type': 'application/json' }
      }))
    });

    const results = await instance;
    expect(results.latency.p99).toBeLessThan(1000);
    expect(results.throughput.average).toBeGreaterThan(5000);
  });
});
