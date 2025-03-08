# MT103 System Compliance Report

## Executive Summary
**Report Date:** {{date}}
**Report Period:** {{startDate}} to {{endDate}}
**Compliance Score:** {{complianceScore}}%

## Regulatory Compliance Status

### SWIFT Standards
- Message Format Compliance: {{swiftFormatCompliance}}%
- Network Security: {{swiftSecurityCompliance}}%
- Audit Trail Completeness: {{auditTrailScore}}%

### Data Protection
- GDPR Compliance: {{gdprScore}}%
- PSD2 Implementation: {{psd2Score}}%
- Data Encryption Status: {{encryptionScore}}%

### Banking Regulations
- AML Checks: {{amlComplianceScore}}%
- KYC Procedures: {{kycScore}}%
- Transaction Monitoring: {{monitoringScore}}%

## Issues & Remediation
{{#each issues}}
### {{this.severity}}: {{this.title}}
- Description: {{this.description}}
- Regulation: {{this.regulation}}
- Due Date: {{this.dueDate}}
- Status: {{this.status}}
{{/each}}

## Recommendations
{{#each recommendations}}
- {{this}}
{{/each}}

## Certification Status
- ISO 27001: {{iso27001Status}}
- SOC 2: {{soc2Status}}
- PCI DSS: {{pciDssStatus}}
