import autocannon from 'autocannon';
import { ComplianceService } from '@/services/compliance/compliance.service';

describe('Complex Load Patterns', () => {
  test('should handle spike traffic pattern', async () => {
    const baseLoad = 100;
    const spikeLoad = 1000;
    const spikeDuration = 5000;

    let currentConnections = baseLoad;
    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/validate',
      duration: 30,
      connections: baseLoad,
      amount: undefined,
      customConstructor: (client) => {
        setInterval(() => {
          currentConnections = Date.now() % spikeDuration < 1000 ? spikeLoad : baseLoad;
          client.setConnections(currentConnections);
        }, 1000);
      }
    });

    const results = await instance;
    expect(results.errors).toBe(0);
    expect(results.latency.p99).toBeLessThan(500);
  });

  test('should maintain performance under chaos conditions', async () => {
    const chaosPatterns = [
      { connections: 50, duration: 2000 },
      { connections: 500, duration: 1000 },
      { connections: 100, duration: 3000 },
      { connections: 1000, duration: 500 }
    ];

    for (const pattern of chaosPatterns) {
      const results = await autocannon({
        url: 'http://localhost:3000/api/compliance/validate',
        connections: pattern.connections,
        duration: pattern.duration
      });

      expect(results.timeouts).toBe(0);
      expect(results.errors).toBeLessThan(results.requests.total * 0.01); // 1% error rate max
    }
  });
});
