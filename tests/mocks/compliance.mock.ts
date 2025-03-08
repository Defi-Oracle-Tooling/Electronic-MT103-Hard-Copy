import { ComplianceService } from '@/services/compliance/compliance.service';
import { ComplianceReport, ComplianceCheck } from '@/types/compliance';

export class MockComplianceService implements Partial<ComplianceService> {
  private reports: ComplianceReport[] = [];
  private checks: ComplianceCheck[] = [];

  async generateReport(config: any): Promise<ComplianceReport> {
    const report = {
      id: `REPORT-${Date.now()}`,
      timestamp: new Date(),
      status: 'completed',
      data: {
        score: 0.95,
        findings: [],
        recommendations: []
      }
    };
    this.reports.push(report);
    return report;
  }

  async validateCompliance(data: any): Promise<ComplianceCheck> {
    const check = {
      id: `CHECK-${Date.now()}`,
      timestamp: new Date(),
      result: 'pass',
      details: {
        rules: ['PSD2', 'GDPR'],
        violations: []
      }
    };
    this.checks.push(check);
    return check;
  }

  getReports(): ComplianceReport[] {
    return this.reports;
  }

  getChecks(): ComplianceCheck[] {
    return this.checks;
  }

  reset(): void {
    this.reports = [];
    this.checks = [];
  }
}
