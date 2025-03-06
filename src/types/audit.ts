export type AuditEventType = 
  | 'LOGIN'
  | 'TRANSACTION'
  | 'CONFIG_CHANGE'
  | 'ACCESS_DENIED'
  | 'COMPLIANCE_CHECK';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  checkFunction: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'AML' | 'KYC' | 'REGULATORY' | 'OPERATIONAL';
}
