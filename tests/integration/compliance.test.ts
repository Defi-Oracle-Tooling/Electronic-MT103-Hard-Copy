import { ComplianceService } from '@/services/compliance/compliance.service';
import { AuditService } from '@/services/audit.service';
import { MetricsService } from '@/services/metrics.service';

describe('Compliance Integration', () => {
  let complianceService: ComplianceService;
  let auditService: AuditService;
  let metricsService: MetricsService;

  beforeAll(async () => {
    complianceService = new ComplianceService();
    auditService = new AuditService();
    metricsService = new MetricsService();
  });

  describe('Transaction Compliance Flow', () => {
    test('should validate and audit compliant transaction', async () => {
      const transaction = {
        id: 'MT103-TEST-001',
        amount: 50000,
        sender: 'BANK-A',
        receiver: 'BANK-B'
      };

      const validationResult = await complianceService.validateTransaction(transaction);
      expect(validationResult.isValid).toBe(true);

      const auditRecord = await auditService.getLatestAuditRecord(transaction.id);
      expect(auditRecord.type).toBe('COMPLIANCE_CHECK');
      expect(auditRecord.result).toBe('PASS');
    });

    test('should track compliance metrics over time', async () => {
      const metrics = await metricsService.getComplianceMetrics({
        timeRange: '24h',
        types: ['VALIDATION', 'AUDIT', 'REPORTING']
      });

      expect(metrics.validationSuccessRate).toBeGreaterThan(0.95);
      expect(metrics.auditCoverage).toBe(1.0);
      expect(metrics.reportingCompleteness).toBe(1.0);
    });
  });
});
