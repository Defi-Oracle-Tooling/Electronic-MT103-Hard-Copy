import { ComplianceDataFlowService } from '@/services/compliance/data-flow.service';
import { SecurityTestUtils } from '../utils/security-test.utils';

describe('Compliance Data Flow Security', () => {
  let flowService: ComplianceDataFlowService;
  let securityUtils: SecurityTestUtils;

  beforeEach(() => {
    flowService = new ComplianceDataFlowService();
    securityUtils = new SecurityTestUtils();
  });

  test('should enforce data classification during transmission', async () => {
    const sensitiveData = {
      accountData: await securityUtils.generateSensitiveData(),
      complianceLevel: 'HIGH'
    };

    const transmission = await flowService.transmitData(sensitiveData);
    expect(transmission.classification).toBe('RESTRICTED');
    expect(transmission.encryptionType).toBe('AES-256-GCM');
  });

  test('should detect and prevent data leakage', async () => {
    const leakAttempt = await securityUtils.simulateDataLeakage({
      dataType: 'COMPLIANCE_RECORDS',
      destination: 'UNAUTHORIZED_ENDPOINT'
    });

    const detection = await flowService.detectLeakage(leakAttempt);
    expect(detection.prevented).toBe(true);
    expect(detection.mitigationActions).toContain('BLOCK_TRANSMISSION');
  });

  test('should validate data flow paths', async () => {
    const flowPath = await flowService.analyzePath({
      source: 'COMPLIANCE_ENGINE',
      destination: 'REPORTING_SERVICE'
    });

    expect(flowPath.isValid).toBe(true);
    expect(flowPath.encryptionPoints.length).toBeGreaterThan(0);
    expect(flowPath.validationChecks).toHaveLength(3);
  });
});
