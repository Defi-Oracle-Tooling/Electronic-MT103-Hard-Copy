import autocannon from 'autocannon';
import { LoadTestScenario } from '@/types/testing';

describe('Complex Load Testing Patterns', () => {
  test('should handle cyclical load patterns', async () => {
    const loadPattern: LoadTestScenario = {
      baseLoad: 100,
      peakLoad: 1000,
      cycleLength: 60, // seconds
      totalDuration: 300, // 5 minutes
      rampUpTime: 10,
      rampDownTime: 10
    };

    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/validate',
      duration: loadPattern.totalDuration,
      connections: loadPattern.baseLoad,
      connectionRate: 100,
      amount: undefined,
      setupClient: (client) => {
        let currentTime = 0;
        setInterval(() => {
          currentTime = (currentTime + 1) % loadPattern.cycleLength;
          const load = calculateDynamicLoad(currentTime, loadPattern);
          client.setConnectionRate(load);
        }, 1000);
      }
    });

    const results = await instance;
    expect(results.errors).toBeLessThan(results.requests.total * 0.001); // 0.1% error rate
  });
});
