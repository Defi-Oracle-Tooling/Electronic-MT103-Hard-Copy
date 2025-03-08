import autocannon from 'autocannon';
import { LoadPattern } from '@/types/testing';

describe('Adaptive Load Testing', () => {
  test('should handle dynamic load patterns', async () => {
    const loadPattern: LoadPattern = {
      phases: [
        { duration: 60, rps: 100, rampUp: 10 },
        { duration: 120, rps: 500, pattern: 'spike' },
        { duration: 60, rps: 200, pattern: 'wave' },
        { duration: 30, rps: 1000, pattern: 'burst' }
      ]
    };

    const instance = autocannon({
      url: 'http://localhost:3000/api/compliance/validate',
      duration: loadPattern.phases.reduce((acc, p) => acc + p.duration, 0),
      setupClient: (client) => {
        let currentPhase = 0;
        let phaseTime = 0;

        setInterval(() => {
          const phase = loadPattern.phases[currentPhase];
          const load = calculatePhaseLoad(phase, phaseTime);
          client.setConnectionRate(load);

          phaseTime++;
          if (phaseTime >= phase.duration) {
            currentPhase++;
            phaseTime = 0;
          }
        }, 1000);
      }
    });

    const results = await instance;
    expect(results.errors).toBeLessThan(results.requests.total * 0.001);
  });
});
