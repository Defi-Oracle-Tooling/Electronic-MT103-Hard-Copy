import { TerminologyDatabase } from '../db/terminology-database';
import { AITermExtractor } from './ai-term-extractor';

export class TerminologyManager {
  private readonly db: TerminologyDatabase;
  private readonly aiExtractor: AITermExtractor;
  private readonly termCache: Map<string, TermEntry[]>;

  constructor() {
    this.db = new TerminologyDatabase();
    this.aiExtractor = new AITermExtractor();
    this.termCache = new Map();
  }

  async extractAndManageTerms(content: string, lang: string): Promise<ManagedTerms> {
    const extractedTerms = await this.aiExtractor.extract(content);
    const categorizedTerms = await this.categorizeTerms(extractedTerms);
    
    return {
      technical: await this.translateTerms(categorizedTerms.technical, lang),
      financial: await this.translateTerms(categorizedTerms.financial, lang),
      regulatory: await this.translateTerms(categorizedTerms.regulatory, lang),
      metadata: this.generateTermMetadata(categorizedTerms)
    };
  }

  private async categorizeTerms(terms: ExtractedTerm[]): Promise<CategorizedTerms> {
    return {
      technical: terms.filter(t => this.isTechnicalTerm(t)),
      financial: terms.filter(t => this.isFinancialTerm(t)),
      regulatory: terms.filter(t => this.isRegulatoryTerm(t))
    };
  }
}
