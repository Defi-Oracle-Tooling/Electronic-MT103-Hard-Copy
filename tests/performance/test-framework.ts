import autocannon, { Options, Result } from 'autocannon';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { cpus } from 'os';

export interface PerformanceTestConfig {
  name: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | object;
  connections?: number;
  duration?: number;
  pipelining?: number;
  timeout?: number;
  workers?: number;
  expectations?: {
    maxErrorRate?: number;
    maxLatencyP99?: number;
    minThroughput?: number;
    maxTimeout?: number;
  };
}

export interface PerformanceTestResult extends Result {
  config: PerformanceTestConfig;
  passedExpectations: boolean;
  failedExpectations: string[];
  timestamp: string;
}

export class PerformanceTestFramework {
  private resultsDir: string = join(process.cwd(), 'performance-results');
  private defaultWorkers: number = Math.max(1, Math.floor(cpus().length / 2));
  
  constructor() {
    this.ensureResultsDirectory();
  }
  
  private async ensureResultsDirectory(): Promise<void> {
    if (!existsSync(this.resultsDir)) {
      await mkdir(this.resultsDir, { recursive: true });
    }
  }
  
  async runTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
    console.log(`Starting performance test: ${config.name}`);
    const startTime = process.hrtime.bigint();
    
    const options: Options = {
      url: config.endpoint,
      method: config.method,
      headers: config.headers,
      connections: config.connections || 100,
      duration: config.duration || 30,
      pipelining: config.pipelining || 1,
      timeout: config.timeout || 10,
      workers: config.workers || this.defaultWorkers,
    };
    
    if (config.body) {
      options.body = typeof config.body === 'string' 
        ? config.body 
        : JSON.stringify(config.body);
    }
    
    const result = await autocannon(options);
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;
    
    // Check expectations
    const failedExpectations: string[] = [];
    if (config.expectations) {
      const { maxErrorRate, maxLatencyP99, minThroughput, maxTimeout } = config.expectations;
      
      if (maxErrorRate !== undefined) {
        const errorRate = (result.errors / result.requests.total) * 100;
        if (errorRate > maxErrorRate) {
          failedExpectations.push(`Error rate ${errorRate.toFixed(2)}% exceeds maximum ${maxErrorRate}%`);
        }
      }
      
      if (maxLatencyP99 !== undefined && result.latency.p99 > maxLatencyP99) {
        failedExpectations.push(`P99 latency ${result.latency.p99}ms exceeds maximum ${maxLatencyP99}ms`);
      }
      
      if (minThroughput !== undefined && result.throughput.average < minThroughput) {
        failedExpectations.push(`Average throughput ${result.throughput.average.toFixed(2)} is below minimum ${minThroughput}`);
      }
      
      if (maxTimeout !== undefined && result.timeouts > maxTimeout) {
        failedExpectations.push(`Timeouts ${result.timeouts} exceeds maximum ${maxTimeout}`);
      }
    }
    
    const testResult: PerformanceTestResult = {
      ...result,
      config,
      passedExpectations: failedExpectations.length === 0,
      failedExpectations,
      timestamp: new Date().toISOString(),
    };
    
    // Log results
    const status = testResult.passedExpectations ? '✅ PASSED' : '❌ FAILED';
    console.log(`Performance test completed in ${executionTimeMs.toFixed(2)}ms: ${status}`);
    if (failedExpectations.length > 0) {
      console.log('Failed expectations:');
      failedExpectations.forEach(failure => console.log(`  - ${failure}`));
    }
    
    // Save detailed results
    await this.saveResults(testResult);
    
    return testResult;
  }
  
  async runTestSuite(configs: PerformanceTestConfig[]): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    
    for (const config of configs) {
      // Add delay between tests to avoid resource contention
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const result = await this.runTest(config);
      results.push(result);
    }
    
    // Generate summary report
    await this.generateSummaryReport(results);
    
    return results;
  }
  
  private async saveResults(result: PerformanceTestResult): Promise<void> {
    const fileName = `${result.config.name.replace(/\s+/g, '-').toLowerCase()}-${result.timestamp.replace(/:/g, '-')}.json`;
    const filePath = join(this.resultsDir, fileName);
    
    await writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Results saved to ${filePath}`);
  }
  
  private async generateSummaryReport(results: PerformanceTestResult[]): Promise<void> {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedTests: results.filter(r => r.passedExpectations).length,
      failedTests: results.filter(r => !r.passedExpectations).length,
      results: results.map(r => ({
        name: r.config.name,
        endpoint: r.config.endpoint,
        status: r.passedExpectations ? 'PASS' : 'FAIL',
        latencyP50: r.latency.p50,
        latencyP99: r.latency.p99,
        throughput: r.throughput.average,
        errors: r.errors,
        timeouts: r.timeouts,
        failedExpectations: r.failedExpectations,
      }))
    };
    
    const summaryPath = join(this.resultsDir, `summary-${summary.timestamp.replace(/:/g, '-')}.json`);
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Summary report saved to ${summaryPath}`);
  }
}
