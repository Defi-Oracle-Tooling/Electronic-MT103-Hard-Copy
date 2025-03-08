import autocannon from 'autocannon';

export class AdvancedLoadTester {
  async runComplexLoadTest(): Promise<TestResults> {
    const scenarios = [
      {
        name: 'Normal Load',
        duration: 300,
        connections: 100,
        pipelining: 10,
        workers: 4
      },
      {
        name: 'Spike Load',
        duration: 60,
        connections: 1000,
        pipelining: 1,
        workers: 8
      },
      {
        name: 'Gradual Ramp',
        duration: 600,
        connectionRate: 10,
        maxConnections: 500,
        workers: 6
      }
    ];

    const results = await Promise.all(
      scenarios.map(scenario => this.runScenario(scenario))
    );

    return this.analyzeResults(results);
  }

  private async runScenario(scenario: LoadScenario): Promise<TestResult> {
    return autocannon({
      url: 'http://localhost:3000/api/mt103/validate',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.getTestToken()}`
      },
      requests: [
        {
          method: 'POST',
          path: '/validate',
          body: JSON.stringify(this.generateTestMessage())
        }
      ],
      ...scenario
    });
  }
}
