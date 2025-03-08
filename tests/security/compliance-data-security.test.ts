import { ComplianceDataService } from '@/services/compliance/compliance-data.service';
import { SecurityTestUtils } from '../utils/security-test.utils';
import { EncryptionService } from '@/services/security/encryption.service';

describe('Compliance Data Security', () => {
  let service: ComplianceDataService;
  let securityUtils: SecurityTestUtils;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    service = new ComplianceDataService();
    securityUtils = new SecurityTestUtils();
    encryptionService = new EncryptionService();
  });

  test('should enforce field-level encryption for sensitive data', async () => {
    const complianceRecord = {
      id: 'TEST-001',
      personalData: {
        accountNumber: '1234567890',
        taxId: 'TAX123456'
      },
      riskAssessment: 'HIGH'
    };

    const stored = await service.storeComplianceData(complianceRecord);
    expect(await encryptionService.isEncrypted(stored.personalData)).toBe(true);
    expect(stored.riskAssessment).toBe('HIGH'); // Non-sensitive remains unencrypted
  });

  test('should prevent data exfiltration attempts', async () => {
    const maliciousQuery = securityUtils.generateDataExfiltrationPayload();
    await expect(service.queryComplianceRecords(maliciousQuery))
      .rejects.toThrow('Invalid query pattern detected');
  });

  test('should maintain data integrity with signatures', async () => {
    const record = await service.createComplianceRecord({
      type: 'PSD2_CHECK',
      result: 'PASS'
    });

    const isValid = await service.verifyRecordIntegrity(record);
    expect(isValid).toBe(true);

    // Attempt tampering
    record.result = 'FAIL';
    const isValidAfterTampering = await service.verifyRecordIntegrity(record);
    expect(isValidAfterTampering).toBe(false);
  });
});
