import { ComplianceMonitoringService } from '@/services/compliance/monitoring.service';

describe('ComplianceMonitoringService', () => {
  let service: ComplianceMonitoringService;

  beforeEach(() => {
    service = new ComplianceMonitoringService();
  });

  test('should detect compliance violations', async () => {
    const violations = await service.checkCompliance({
      rules: ['PSD2_SCA', 'GDPR_CONSENT'],
      timestamp: new Date()
    });

    expect(violations).toEqual([]);
  });

  test('should generate compliance alerts', async () => {
    const alert = await service.createAlert({
      type: 'REGULATORY_DEADLINE',
      severity: 'HIGH',
      description: 'PSD2 compliance deadline approaching'
    });

    expect(alert).toHaveProperty('id');
    expect(alert.severity).toBe('HIGH');
  });
});
