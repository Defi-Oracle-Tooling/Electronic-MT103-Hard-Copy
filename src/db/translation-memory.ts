import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class TranslationMemory {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool(/* config */);
  }

  async addEntry(entry: TranslationEntry): Promise<void> {
    const { source, translation, language, context } = entry;
    
    await this.pool.query(`
      INSERT INTO translation_memory 
      (source_text, translated_text, lang_code, context, similarity_key)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (similarity_key, lang_code) 
      DO UPDATE SET usage_count = translation_memory.usage_count + 1
    `, [source, translation, language, context, this.generateSimilarityKey(source)]);
  }

  async findSimilarTranslations(text: string, targetLang: string): Promise<TranslationEntry[]> {
    const result = await this.pool.query(`
      SELECT * FROM translation_memory
      WHERE lang_code = $1
      AND similarity(similarity_key, $2) > 0.8
      ORDER BY similarity(similarity_key, $2) DESC, usage_count DESC
      LIMIT 5
    `, [targetLang, this.generateSimilarityKey(text)]);

    return result.rows;
  }

  private generateSimilarityKey(text: string): string {
    // Implement fuzzy matching key generation
    return text.toLowerCase().replace(/[^\w\s]/g, '');
  }
}
