import { ComplianceScenarioRunner } from '@/services/compliance/scenario-runner';
import { RegulatoryService } from '@/services/compliance/regulatory.service';

describe('Multi-Regulatory Compliance Scenarios', () => {
  let scenarioRunner: ComplianceScenarioRunner;
  let regulatoryService: RegulatoryService;

  beforeEach(() => {
    scenarioRunner = new ComplianceScenarioRunner();
    regulatoryService = new RegulatoryService();
  });

  test('should handle conflicting regulatory requirements', async () => {
    const transaction = {
      amount: 2000000,
      sourceCountry: 'US',
      destinationCountry: 'EU',
      dataSubjects: ['EU_RESIDENT'],
      sensitiveDataTypes: ['PII', 'FINANCIAL']
    };

    const result = await scenarioRunner.resolveRegulatoryConflicts(transaction);
    expect(result.appliedRegulations).toEqual(
      expect.arrayContaining(['GDPR', 'PSD2', 'FATF', 'BSA'])
    );
    expect(result.retentionPolicy).toBe('7_YEARS'); // Longest retention period wins
    expect(result.dataHandling.encryption).toBe('QUANTUM_RESISTANT');
  });

  test('should cascade regulatory requirements across jurisdictions', async () => {
    const parties = [
      { country: 'SG', role: 'INITIATOR' },
      { country: 'US', role: 'INTERMEDIARY' },
      { country: 'CH', role: 'BENEFICIARY' }
    ];

    const requirements = await regulatoryService.resolveCascadingRequirements(parties);
    expect(requirements.map(r => r.regulation)).toContain('MAS_TRM');
    expect(requirements.map(r => r.regulation)).toContain('FINMA_RULES');
  });
});
