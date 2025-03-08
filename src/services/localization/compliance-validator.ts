import { ComplianceRules } from '../config/compliance-rules';
import { RegionalRequirements } from '../config/regional-requirements';

export class ComplianceValidator {
  private readonly rules: ComplianceRules;
  private readonly regionalReqs: RegionalRequirements;

  async validateTranslation(
    source: string,
    translation: string,
    targetLang: string
  ): Promise<ValidationResult> {
    const region = this.getRegionForLanguage(targetLang);
    const applicableRules = await this.getApplicableRules(region);
    
    const validations = await Promise.all([
      this.validateRegulatory(translation, region),
      this.validatePrivacy(translation),
      this.validateFinancialTerms(translation),
      this.validateLegalRequirements(translation, region)
    ]);

    return {
      passed: validations.every(v => v.passed),
      details: this.aggregateValidationDetails(validations),
      requiredActions: this.determineRequiredActions(validations),
      metadata: {
        region,
        appliedRules: applicableRules.map(r => r.id),
        timestamp: new Date().toISOString()
      }
    };
  }

  private async validateRegulatory(
    translation: string, 
    region: string
  ): Promise<RegulatoryValidation> {
    const rules = await this.rules.getRegulatoryRules(region);
    return this.applyRegulatoryRules(translation, rules);
  }

  private async validateFinancialCompliance(
    translation: string,
    region: string
  ): Promise<FinancialComplianceResult> {
    const [
      messageFormat,
      swiftCompliance,
      regionalStandards,
      dataProtection
    ] = await Promise.all([
      this.validateMessageFormat(translation),
      this.validateSWIFTCompliance(translation),
      this.validateRegionalStandards(translation, region),
      this.validateDataProtection(translation, region)
    ]);

    return {
      passed: messageFormat && swiftCompliance && regionalStandards && dataProtection,
      validations: {
        messageFormat,
        swiftCompliance,
        regionalStandards,
        dataProtection
      },
      requiredActions: this.determineRequiredActions({
        messageFormat,
        swiftCompliance,
        regionalStandards,
        dataProtection
      })
    };
  }
}
