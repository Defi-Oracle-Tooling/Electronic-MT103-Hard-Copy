import { ComplianceDataService } from '@/services/compliance/compliance-data.service';
import { SecurityUtils } from '@/utils/security';

describe('Compliance Data Access Security', () => {
  let service: ComplianceDataService;
  let securityUtils: SecurityUtils;

  beforeEach(() => {
    service = new ComplianceDataService();
    securityUtils = new SecurityUtils();
  });

  test('should enforce attribute-based access control', async () => {
    const userContext = {
      roles: ['COMPLIANCE_ANALYST'],
      jurisdiction: 'EU',
      clearanceLevel: 'L2'
    };

    const data = await service.fetchSensitiveData('REPORT-123', userContext);
    expect(data.redactedFields).toContain('personalIdentifiers');
    expect(data.accessLevel).toBe('L2');
  });

  test('should detect and block suspicious data access patterns', async () => {
    const bulkRequest = await securityUtils.simulateSuspiciousAccess({
      pattern: 'BULK_DOWNLOAD',
      timeWindow: '5m',
      recordCount: 1000
    });

    await expect(service.processDataRequest(bulkRequest))
      .rejects.toThrow('Suspicious access pattern detected');
  });
});
