import { ComplianceProvider } from '@/types/compliance';

export class ComplianceEdgeCaseMock implements ComplianceProvider {
  private readonly edgeCases = new Map<string, () => Promise<any>>();

  constructor() {
    this.initializeEdgeCases();
  }

  private initializeEdgeCases(): void {
    this.edgeCases.set('PARTIAL_VALIDATION_FAILURE', async () => ({
      status: 'PARTIAL_SUCCESS',
      validRules: ['AML_CHECK'],
      failedRules: ['PSD2_SCA'],
      error: new Error('SCA service unavailable')
    }));

    this.edgeCases.set('DELAYED_RESPONSE', async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { status: 'SUCCESS', latency: 5000 };
    });

    this.edgeCases.set('DATA_CORRUPTION', async () => ({
      status: 'ERROR',
      data: Buffer.from('corrupted').toString('base64'),
      integrity: false
    }));
  }

  async simulateEdgeCase(caseName: string, config?: any): Promise<any> {
    const handler = this.edgeCases.get(caseName);
    if (!handler) {
      throw new Error(`Unknown edge case: ${caseName}`);
    }
    return handler();
  }

  async addCustomEdgeCase(name: string, handler: () => Promise<any>): Promise<void> {
    this.edgeCases.set(name, handler);
  }
}
