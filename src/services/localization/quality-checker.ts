import { bleuScore } from '@nlpjs/similarity';
import { TranslationMemory } from '../db/translation-memory';

export class QualityChecker {
  private memory: TranslationMemory;
  
  constructor() {
    this.memory = new TranslationMemory();
  }

  async checkQuality(source: string, translation: string, targetLang: string): Promise<QualityReport> {
    const [
      terminologyScore,
      bleuScore,
      consistencyScore,
      complianceScore
    ] = await Promise.all([
      this.checkTerminology(translation, targetLang),
      this.calculateBLEUScore(source, translation),
      this.checkConsistency(translation, targetLang),
      this.validateCompliance(translation, targetLang)
    ]);

    const weightedScore = this.calculateWeightedScore({
      terminology: terminologyScore,
      bleu: bleuScore,
      consistency: consistencyScore,
      compliance: complianceScore
    });

    return {
      score: weightedScore,
      details: {
        terminologyScore,
        bleuScore,
        consistencyScore,
        complianceScore
      },
      suggestions: await this.generateImprovementSuggestions(translation, targetLang)
    };
  }

  private async checkTerminology(translation: string, targetLang: string): Promise<number> {
    const glossary = await this.memory.getTerminology(targetLang);
    const matches = this.findTerminologyMatches(translation, glossary);
    return matches.correctCount / matches.totalCount;
  }
}
