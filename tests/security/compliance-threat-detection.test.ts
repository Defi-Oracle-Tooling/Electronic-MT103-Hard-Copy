import { ComplianceSecurityService } from '@/services/compliance/security.service';
import { SecurityTestUtils } from '../utils/security-test.utils';

describe('Compliance Threat Detection', () => {
  let securityService: ComplianceSecurityService;
  let testUtils: SecurityTestUtils;

  beforeEach(() => {
    securityService = new ComplianceSecurityService();
    testUtils = new SecurityTestUtils();
  });

  test('should detect unusual compliance patterns', async () => {
    const suspiciousActivity = await testUtils.generateSuspiciousPattern({
      frequency: 'abnormal',
      timeWindow: '5m',
      source: 'unknown-ip'
    });

    const threat = await securityService.analyzePattern(suspiciousActivity);
    expect(threat.score).toBeGreaterThan(0.8);
    expect(threat.type).toBe('ANOMALOUS_BEHAVIOR');
  });

  test('should prevent parameter tampering', async () => {
    const tamperAttempt = await testUtils.simulateParameterTampering({
      target: 'compliance-report',
      method: 'timestamp-manipulation'
    });

    const detection = await securityService.detectTampering(tamperAttempt);
    expect(detection.detected).toBe(true);
    expect(detection.mitigationApplied).toBe(true);
  });

  test('should identify data exfiltration attempts', async () => {
    const exfilAttempt = testUtils.simulateDataExfiltration({
      dataType: 'compliance-records',
      method: 'large-result-set'
    });

    const result = await securityService.detectExfiltration(exfilAttempt);
    expect(result.blocked).toBe(true);
    expect(result.alertGenerated).toBe(true);
  });
});
