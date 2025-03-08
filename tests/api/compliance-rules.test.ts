import { ComplianceRuleEngine } from '@/services/compliance/rule-engine.service';
import { ComplianceRule } from '@/types/compliance';

describe('Compliance Rules API', () => {
  let ruleEngine: ComplianceRuleEngine;
  
  beforeEach(() => {
    ruleEngine = new ComplianceRuleEngine();
  });

  describe('Transaction Amount Limits', () => {
    test('should enforce PSD2 strong authentication thresholds', async () => {
      const response = await ruleEngine.validateTransaction({
        amount: 50000,
        currency: 'EUR',
        type: 'CROSS_BORDER'
      });

      expect(response.requiresSCA).toBe(true);
      expect(response.appliedRules).toContain('PSD2_STRONG_AUTH');
    });

    test('should handle multiple currency thresholds', async () => {
      const transactions = [
        { amount: 15000, currency: 'USD' },
        { amount: 12000, currency: 'EUR' },
        { amount: 1000000, currency: 'JPY' }
      ];

      const results = await Promise.all(
        transactions.map(tx => ruleEngine.validateAmount(tx))
      );

      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.validations).toHaveLength(3); // Currency, Amount, Limit checks
      });
    });
  });

  describe('AML Compliance Rules', () => {
    test('should detect structured transactions', async () => {
      const relatedTransactions = [
        { id: '1', amount: 2900 },
        { id: '2', amount: 2900 },
        { id: '3', amount: 2900 }
      ];

      const detection = await ruleEngine.detectStructuring(relatedTransactions);
      expect(detection.isStructured).toBe(true);
      expect(detection.riskScore).toBeGreaterThan(0.8);
    });
  });
});
