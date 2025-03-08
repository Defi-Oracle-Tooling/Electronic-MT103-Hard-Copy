export interface AlertConfig {
  id: string;
  name: string;
  rules: ComplianceRule[];
  threshold: number;
  actions: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediationSteps: string[];
}

export interface ComplianceEvidence {
  securityControls: Record<string, boolean>;
  dataProtection: Record<string, string>;
  availability: Record<string, number>;
  processingIntegrity: Record<string, boolean>;
  confidentiality: Record<string, string>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
}

export interface RegulatoryData {
  gdpr: Record<string, boolean>;
  psd2: Record<string, boolean>;
  iso27001: Record<string, boolean>;
}
