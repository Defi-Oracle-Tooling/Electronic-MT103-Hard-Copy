import { ComplianceProvider, ComplianceCheck } from '@/types/compliance';
import { MockFactory } from '@/test/utils/mock-factory';

export class MockExternalComplianceService implements ComplianceProvider {
  private mockFactory: MockFactory;
  private simulatedLatency: number = 50;
  private failureRate: number = 0.01;

  constructor(config?: { latency?: number; failureRate?: number }) {
    this.mockFactory = new MockFactory();
    this.simulatedLatency = config?.latency ?? 50;
    this.failureRate = config?.failureRate ?? 0.01;
  }

  async performComplianceCheck(data: any): Promise<ComplianceCheck> {
    await this.simulateNetworkDelay();
    this.simulateRandomFailure();

    return {
      id: this.mockFactory.generateId(),
      timestamp: new Date(),
      status: 'completed',
      result: this.mockFactory.generateComplianceResult(),
      details: this.mockFactory.generateComplianceDetails(data)
    };
  }

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => 
      setTimeout(resolve, this.simulatedLatency * (0.5 + Math.random()))
    );
  }

  private simulateRandomFailure(): void {
    if (Math.random() < this.failureRate) {
      throw new Error('External service temporarily unavailable');
    }
  }

  setSimulatedConditions(conditions: { latency?: number; failureRate?: number }): void {
    this.simulatedLatency = conditions.latency ?? this.simulatedLatency;
    this.failureRate = conditions.failureRate ?? this.failureRate;
  }
}
