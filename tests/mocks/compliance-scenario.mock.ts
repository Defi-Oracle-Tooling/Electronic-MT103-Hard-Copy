import { ComplianceScenario, ComplianceResult } from '@/types/compliance';

export class ComplianceScenarioMock {
  private scenarios: Map<string, ComplianceScenario>;
  private currentState: string;

  constructor() {
    this.scenarios = new Map();
    this.initializeScenarios();
  }

  private initializeScenarios(): void {
    // Regulatory Change Scenario
    this.scenarios.set('REGULATORY_CHANGE', {
      type: 'REGULATORY_UPDATE',
      steps: [
        { action: 'UPDATE_RULES', delay: 100 },
        { action: 'RETRAIN_MODELS', delay: 500 },
        { action: 'VALIDATE_CHANGES', delay: 200 }
      ],
      expectedOutcome: 'RULES_UPDATED'
    });

    // System Degradation Scenario
    this.scenarios.set('SYSTEM_DEGRADATION', {
      type: 'PERFORMANCE_IMPACT',
      steps: [
        { action: 'INCREASE_LATENCY', delay: 1000 },
        { action: 'REDUCE_THROUGHPUT', delay: 0 },
        { action: 'TRIGGER_ALERTS', delay: 100 }
      ],
      expectedOutcome: 'DEGRADED_PERFORMANCE'
    });
  }

  async runScenario(name: string): Promise<ComplianceResult> {
    const scenario = this.scenarios.get(name);
    if (!scenario) throw new Error(`Unknown scenario: ${name}`);

    for (const step of scenario.steps) {
      await this.executeStep(step);
    }

    return {
      scenarioName: name,
      outcome: scenario.expectedOutcome,
      executionTime: this.calculateExecutionTime(scenario)
    };
  }

  private async executeScenario(scenario: ComplianceScenario): Promise<void> {
    const context = {
      startTime: Date.now(),
      metrics: new Map<string, number>(),
      state: 'RUNNING'
    };

    try {
      for (const stage of scenario.stages) {
        await this.executeStage(stage, context);
        await this.validateStageOutput(stage, context);
        await this.collectMetrics(stage, context);
      }

      await this.finalizeScenario(scenario, context);
    } catch (error) {
      await this.handleScenarioFailure(scenario, error, context);
    }
  }

  private async validateStageOutput(stage: ScenarioStage, context: ScenarioContext): Promise<void> {
    const validation = stage.validations?.map(async validator => {
      const result = await validator(context);
      if (!result.valid) {
        throw new Error(`Validation failed: ${result.message}`);
      }
    });

    await Promise.all(validation || []);
  }
}
