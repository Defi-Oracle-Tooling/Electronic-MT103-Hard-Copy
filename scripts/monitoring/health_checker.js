const { trace } = require('@opentelemetry/api');
const CircuitBreaker = require('./circuit_breaker');
const { sendMetrics } = require('./metrics');

class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.circuitBreakers = new Map();
        this.setupDefaultChecks();
    }

    setupDefaultChecks() {
        // Database health
        this.addCheck('database', async () => {
            const span = trace.getTracer('health').startSpan('database.health');
            try {
                await this.checkDatabase();
                return { status: 'healthy' };
            } catch (error) {
                return { status: 'unhealthy', error: error.message };
            } finally {
                span.end();
            }
        });

        // Message queue health
        this.addCheck('messageQueue', async () => {
            const span = trace.getTracer('health').startSpan('queue.health');
            try {
                await this.checkMessageQueue();
                return { status: 'healthy' };
            } catch (error) {
                return { status: 'unhealthy', error: error.message };
            } finally {
                span.end();
            }
        });

        // External API dependencies
        this.addCheck('externalAPIs', async () => {
            const span = trace.getTracer('health').startSpan('external.health');
            try {
                const results = await this.checkExternalAPIs();
                return { status: 'healthy', dependencies: results };
            } catch (error) {
                return { status: 'degraded', error: error.message };
            } finally {
                span.end();
            }
        });
    }

    addCheck(name, checkFn) {
        this.checks.set(name, checkFn);
        this.circuitBreakers.set(name, new CircuitBreaker());
    }

    async runHealthCheck() {
        const results = await Promise.all(this.checks.map(check => check()));
        await sendMetrics('health', { results });
        return results;
    }
}

module.exports = new HealthChecker();
