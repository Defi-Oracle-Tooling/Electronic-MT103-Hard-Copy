import { FinancialGlossary } from '../db/financial-glossary';
import { RegulatoryTerms } from '../config/regulatory-terms';

export class FinancialTerminologyValidator {
  private readonly glossary: FinancialGlossary;
  private readonly regulatoryTerms: RegulatoryTerms;

  constructor() {
    this.glossary = new FinancialGlossary();
    this.regulatoryTerms = new RegulatoryTerms();
  }

  async validateFinancialTerms(
    content: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<ValidationResult> {
    const terms = await this.extractFinancialTerms(content);
    const standardizedTerms = await this.standardizeTerms(terms, sourceLang);
    
    return {
      isValid: await this.validateTermTranslations(standardizedTerms, targetLang),
      termMatches: await this.findTermMatches(standardizedTerms, targetLang),
      regulatoryCompliance: await this.checkRegulatoryCompliance(standardizedTerms),
      suggestedCorrections: await this.generateCorrections(standardizedTerms)
    };
  }

  private async extractFinancialTerms(content: string): Promise<FinancialTerm[]> {
    const patterns = await this.getFinancialPatterns();
    return patterns.reduce((terms, pattern) => {
      const matches = content.match(pattern.regex);
      return [...terms, ...(matches || []).map(match => ({
        term: match,
        category: pattern.category,
        importance: pattern.importance
      }))];
    }, [] as FinancialTerm[]);
  }
}
