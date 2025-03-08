import { ComplianceReportingService } from '@/services/compliance/reporting.service';

describe('ComplianceReportingService', () => {
  let service: ComplianceReportingService;

  beforeEach(() => {
    service = new ComplianceReportingService();
  });

  test('should generate compliant report with required sections', async () => {
    const report = await service.generateComplianceReport({
      type: 'QUARTERLY',
      includeMetrics: true,
      regulations: ['GDPR', 'PSD2', 'ISO27001']
    });

    expect(report).toMatchObject({
      timestamp: expect.any(Date),
      complianceStatus: expect.any(Object),
      recommendations: expect.any(Array)
    });
    expect(report.regulatoryData).toBeDefined();
  });

  test('should handle scheduled report generation', async () => {
    const schedule = {
      type: 'MONTHLY',
      dayOfMonth: 1,
      recipients: ['compliance@example.com']
    };

    await expect(service.scheduleAutomatedReports(schedule))
      .resolves.not.toThrow();
  });
});
