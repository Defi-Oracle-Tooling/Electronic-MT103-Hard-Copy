const EventEmitter = require('events');

class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 30000;
        this.halfOpenTimeout = options.halfOpenTimeout || 10000;
        this.state = 'CLOSED';
        this.failures = 0;
        this.lastFailure = null;
        this.nextRetry = null;
    }

    async execute(operation, fallback) {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextRetry) {
                this.setState('HALF_OPEN');
            } else {
                return await fallback();
            }
        }

        try {
            const result = await operation();
            if (this.state === 'HALF_OPEN') {
                this.setState('CLOSED');
            }
            this.failures = 0;
            return result;
        } catch (error) {
            this.handleFailure();
            throw error;
        }
    }

    handleFailure() {
        this.failures++;
        this.lastFailure = Date.now();

        if (this.failures >= this.failureThreshold) {
            this.setState('OPEN');
            this.nextRetry = Date.now() + this.resetTimeout;
        }
    }

    setState(state) {
        this.state = state;
        this.emit('stateChange', { state, timestamp: Date.now() });
    }
}

module.exports = CircuitBreaker;
