import { ComplianceScenarioRunner } from '@/services/compliance/scenario-runner';
import { ComplianceRuleEngine } from '@/services/compliance/rule-engine.service';

describe('Advanced Compliance Scenarios', () => {
  let scenarioRunner: ComplianceScenarioRunner;
  let ruleEngine: ComplianceRuleEngine;

  beforeEach(() => {
    scenarioRunner = new ComplianceScenarioRunner();
    ruleEngine = new ComplianceRuleEngine();
  });

  test('should handle multi-jurisdiction transaction chain', async () => {
    const transactionChain = [
      { jurisdiction: 'US', phase: 'INITIATION' },
      { jurisdiction: 'EU', phase: 'INTERMEDIARY' },
      { jurisdiction: 'SG', phase: 'FINAL_SETTLEMENT' }
    ];

    const result = await scenarioRunner.executeTransactionChain(transactionChain);
    expect(result.validations).toHaveLength(transactionChain.length);
    expect(result.appliedRegulations).toContain('FATF_RECOMMENDATION_16');
  });

  test('should enforce tiered regulatory requirements', async () => {
    const scenarios = [
      { amount: 5000, tier: 'BASIC' },
      { amount: 50000, tier: 'ENHANCED' },
      { amount: 1000000, tier: 'CRITICAL' }
    ];

    for (const scenario of scenarios) {
      const requirements = await ruleEngine.getTierRequirements(scenario);
      expect(requirements.controls.length).toBeGreaterThanOrEqual(
        scenario.tier === 'CRITICAL' ? 5 : 
        scenario.tier === 'ENHANCED' ? 3 : 1
      );
    }
  });
});
