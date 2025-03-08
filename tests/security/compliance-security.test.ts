import { ComplianceService } from '@/services/compliance/compliance.service';
import { SecurityTestUtils } from '../utils/security-test.utils';

describe('Compliance Security Tests', () => {
  let service: ComplianceService;
  let securityUtils: SecurityTestUtils;

  beforeEach(() => {
    service = new ComplianceService();
    securityUtils = new SecurityTestUtils();
  });

  test('should prevent unauthorized access to compliance reports', async () => {
    const response = await securityUtils.attemptUnauthorizedAccess('/api/compliance/reports');
    expect(response.status).toBe(403);
  });

  test('should detect and block injection attempts in compliance data', async () => {
    const maliciousPayload = securityUtils.generateMaliciousPayload();
    await expect(service.validateComplianceData(maliciousPayload))
      .rejects.toThrow('Invalid data format');
  });

  test('should enforce encryption for sensitive compliance data', async () => {
    const report = await service.generateComplianceReport({ type: 'SENSITIVE' });
    const isEncrypted = await securityUtils.verifyEncryption(report.data);
    expect(isEncrypted).toBe(true);
  });

  test('should maintain audit trail for compliance actions', async () => {
    const action = await service.performComplianceCheck({
      type: 'PSD2',
      data: { /* test data */ }
    });

    const audit = await service.getAuditTrail(action.id);
    expect(audit).toContain({
      actor: expect.any(String),
      action: 'COMPLIANCE_CHECK',
      timestamp: expect.any(Date)
    });
  });

  describe('Regulatory Data Protection', () => {
    test('should enforce field-level encryption for PII', async () => {
      const data = {
        transactionId: 'TX123',
        accountHolder: 'John Doe',
        accountNumber: '1234567890',
        taxId: 'TAX123456'
      };

      const processed = await service.processRegulatoryData(data);
      const decrypted = await securityUtils.decryptFields(processed);

      expect(processed.accountHolder).not.toBe(data.accountHolder);
      expect(processed.accountNumber).not.toBe(data.accountNumber);
      expect(decrypted.accountHolder).toBe(data.accountHolder);
    });

    test('should implement key rotation for compliance data', async () => {
      const oldKey = await service.getCurrentEncryptionKey();
      await service.rotateEncryptionKeys();
      const newKey = await service.getCurrentEncryptionKey();

      expect(newKey.version).toBeGreaterThan(oldKey.version);
      expect(newKey.createdAt).toBeGreaterThan(oldKey.createdAt);
    });
  });
});
