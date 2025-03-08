import { ComplianceScenarioRunner } from '@/services/compliance/scenario-runner';
import { ComplianceRuleEngine } from '@/services/compliance/rule-engine.service';

describe('Complex Compliance Scenarios', () => {
  let scenarioRunner: ComplianceScenarioRunner;

  beforeEach(() => {
    scenarioRunner = new ComplianceScenarioRunner();
  });

  test('should handle cascading regulatory requirements', async () => {
    const scenario = {
      primaryRegulation: 'GDPR',
      triggers: ['PSD2', 'AML5', 'FATF'],
      transaction: {
        amount: 1000000,
        parties: ['EU_BANK', 'US_BANK', 'SG_BANK'],
        dataSubjects: ['EU_RESIDENT']
      }
    };

    const result = await scenarioRunner.executeCascadingScenario(scenario);
    expect(result.appliedRegulations).toEqual(
      expect.arrayContaining(['GDPR', 'PSD2', 'AML5', 'FATF'])
    );
    expect(result.validationChain).toHaveLength(4);
  });

  test('should handle regulatory conflict resolution', async () => {
    const conflictingRequirements = {
      gdpr: { dataRetention: '30d' },
      aml: { dataRetention: '5y' },
      priority: 'HIGHER_REQUIREMENT'
    };

    const resolution = await scenarioRunner.resolveRegulationConflict(
      conflictingRequirements
    );
    expect(resolution.appliedRetention).toBe('5y');
    expect(resolution.justification).toContain('AML overrides GDPR');
  });
});
