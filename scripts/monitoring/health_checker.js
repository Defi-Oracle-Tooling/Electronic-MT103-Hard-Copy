const { trace } = require('@opentelemetry/api');
const CircuitBreaker = require('./circuit_breaker');

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
        const results = {};
        const tracer = trace.getTracer('health');
        const span = tracer.startSpan('system.health.check');

        try {
            for (const [name, check] of this.checks) {
                const breaker = this.circuitBreakers.get(name);
                try {
                    results[name] = await breaker.execute(check);
                } catch (error) {
                    results[name] = { status: 'unhealthy', error: error.message };
                }
            }
            return results;
        } finally {
            span.end();
        }
    }
}

module.exports = new HealthChecker();
