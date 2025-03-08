import { BLEUScorer } from './scorers/bleu';
import { TERScorer } from './scorers/ter';
import { METEORScorer } from './scorers/meteor';

export class QualityMetricsService {
  private readonly bleuScorer: BLEUScorer;
  private readonly terScorer: TERScorer;
  private readonly meteorScorer: METEORScorer;

  async calculateMetrics(source: string, translation: string): Promise<TranslationMetrics> {
    const [bleu, ter, meteor] = await Promise.all([
      this.bleuScorer.score(source, translation),
      this.terScorer.score(source, translation),
      this.meteorScorer.score(source, translation)
    ]);

    return {
      bleu,
      ter,
      meteor,
      consistencyScore: await this.calculateConsistencyScore(translation),
      fluencyScore: await this.calculateFluencyScore(translation),
      technicalAccuracy: await this.assessTechnicalAccuracy(translation),
      metadata: {
        timestamp: new Date().toISOString(),
        sourceLength: source.length,
        translationLength: translation.length,
        language: await this.detectLanguage(translation)
      }
    };
  }

  private async calculateConsistencyScore(translation: string): Promise<number> {
    const termUsage = await this.analyzeTerminologyUsage(translation);
    const styleConsistency = await this.checkStyleConsistency(translation);
    return this.combineScores([termUsage, styleConsistency]);
  }

  private async calculateFinancialAccuracy(
    source: string,
    translation: string,
    context: FinancialContext
  ): Promise<FinancialAccuracyMetrics> {
    const [
      termAccuracy,
      numericalAccuracy,
      regulatoryAccuracy,
      contextualAccuracy
    ] = await Promise.all([
      this.calculateTermAccuracy(source, translation),
      this.validateNumericalValues(source, translation),
      this.assessRegulatoryCompliance(translation, context.regulations),
      this.evaluateContextualAccuracy(translation, context)
    ]);

    return {
      overall: this.calculateWeightedScore({
        termAccuracy: { score: termAccuracy, weight: 0.3 },
        numericalAccuracy: { score: numericalAccuracy, weight: 0.3 },
        regulatoryAccuracy: { score: regulatoryAccuracy, weight: 0.2 },
        contextualAccuracy: { score: contextualAccuracy, weight: 0.2 }
      }),
      details: {
        termAccuracy,
        numericalAccuracy,
        regulatoryAccuracy,
        contextualAccuracy
      },
      confidence: this.calculateConfidenceScore([
        termAccuracy,
        numericalAccuracy,
        regulatoryAccuracy,
        contextualAccuracy
      ])
    };
  }
}
