import { ComplianceScenarioRunner } from '@/services/compliance/scenario-runner';
import { RegulatoryService } from '@/services/compliance/regulatory.service';

describe('Regulatory Edge Cases', () => {
  let scenarioRunner: ComplianceScenarioRunner;
  let regulatoryService: RegulatoryService;

  beforeEach(() => {
    scenarioRunner = new ComplianceScenarioRunner();
    regulatoryService = new RegulatoryService();
  });

  test('should handle regulatory framework transitions', async () => {
    const transitionScenario = {
      oldFramework: { name: 'PSD1', version: '1.0' },
      newFramework: { name: 'PSD2', version: '2.0' },
      transitionPeriod: {
        start: new Date('2024-01-01'),
        end: new Date('2024-06-30')
      },
      transactions: [
        { id: 'TX1', date: new Date('2024-03-15'), amount: 50000 },
        { id: 'TX2', date: new Date('2024-07-01'), amount: 50000 }
      ]
    };

    const result = await scenarioRunner.handleFrameworkTransition(transitionScenario);
    expect(result.transactions[0].appliedFramework).toBe('DUAL');
    expect(result.transactions[1].appliedFramework).toBe('PSD2');
  });

  test('should resolve conflicting jurisdictional requirements', async () => {
    const conflictScenario = {
      transaction: {
        amount: 1000000,
        originCountry: 'US',
        intermediaryCountries: ['CH', 'SG'],
        destinationCountry: 'EU',
        involvedRegulations: ['GDPR', 'FATCA', 'MAS-TRM', 'FINMA']
      }
    };

    const resolution = await regulatoryService.resolveJurisdictionalConflicts(conflictScenario);
    expect(resolution.appliedHierarchy).toEqual(['FATCA', 'GDPR', 'FINMA', 'MAS-TRM']);
    expect(resolution.validationPath).toHaveLength(4);
  });
});
