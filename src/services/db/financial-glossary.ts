import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class FinancialGlossary {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool(/* config */);
  }

  async getTermTranslation(
    term: string,
    sourceLang: string,
    targetLang: string
  ): Promise<FinancialTermTranslation> {
    const result = await this.pool.query(`
      SELECT 
        translation,
        context,
        regulatory_framework,
        validation_rules,
        usage_examples
      FROM financial_terms
      WHERE source_term = $1
        AND source_lang = $2
        AND target_lang = $3
    `, [term, sourceLang, targetLang]);

    return result.rows[0];
  }

  async validateTermUsage(
    term: string,
    context: string,
    lang: string
  ): Promise<ValidationResult> {
    const rules = await this.getTermValidationRules(term, lang);
    return this.applyValidationRules(term, context, rules);
  }

  async addOrUpdateTerm(term: FinancialTerm): Promise<void> {
    await this.pool.query(`
      INSERT INTO financial_terms (
        source_term,
        source_lang,
        target_lang,
        translation,
        context,
        regulatory_framework,
        validation_rules,
        usage_examples,
        last_updated,
        approved_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (source_term, source_lang, target_lang)
      DO UPDATE SET
        translation = EXCLUDED.translation,
        context = EXCLUDED.context,
        regulatory_framework = EXCLUDED.regulatory_framework,
        validation_rules = EXCLUDED.validation_rules,
        usage_examples = EXCLUDED.usage_examples,
        last_updated = NOW(),
        approved_by = EXCLUDED.approved_by
    `, [
      term.sourceTerm,
      term.sourceLang,
      term.targetLang,
      term.translation,
      term.context,
      term.regulatoryFramework,
      term.validationRules,
      term.usageExamples,
      term.approvedBy
    ]);
  }

  async searchTerms(query: TermSearchQuery): Promise<FinancialTerm[]> {
    const result = await this.pool.query(`
      SELECT * FROM financial_terms
      WHERE 
        (source_term ILIKE $1 OR translation ILIKE $1)
        AND ($2::varchar[] IS NULL OR source_lang = ANY($2))
        AND ($3::varchar[] IS NULL OR target_lang = ANY($3))
        AND ($4::varchar[] IS NULL OR regulatory_framework && $4)
      ORDER BY usage_count DESC
      LIMIT $5
    `, [
      `%${query.searchText}%`,
      query.sourceLangs,
      query.targetLangs,
      query.frameworks,
      query.limit || 10
    ]);

    return result.rows;
  }
}
