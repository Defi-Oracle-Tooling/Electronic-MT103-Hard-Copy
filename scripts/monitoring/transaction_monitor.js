const EventEmitter = require('events');

class TransactionMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            totalTransactions: 0,
            failedValidations: 0,
            processingTimes: [],
            lastProcessed: null
        };
        this.healthStatus = { status: 'healthy' };

        this.thresholds = {
            maxProcessingTime: 1000, // 1 second
            errorRateThreshold: 0.05, // 5%
            highLoadThreshold: 1000 // requests per minute
        };
        
        this.alerts = [];
        this.minuteStats = new Map(); // Store per-minute statistics
    }

    trackProcessingTime(startTime) {
        const duration = Date.now() - startTime;
        this.metrics.processingTimes.push(duration);
        if (this.metrics.processingTimes.length > 100) {
            this.metrics.processingTimes.shift();
        }
        return duration;
    }

    getAverageProcessingTime() {
        if (this.metrics.processingTimes.length === 0) return 0;
        const sum = this.metrics.processingTimes.reduce((a, b) => a + b, 0);
        return sum / this.metrics.processingTimes.length;
    }

    checkThresholds() {
        const avgTime = this.getAverageProcessingTime();
        const errorRate = this.getErrorRate();
        const currentLoad = this.getCurrentLoad();

        if (avgTime > this.thresholds.maxProcessingTime) {
            this.raiseAlert('HIGH_LATENCY', `Average processing time (${avgTime}ms) exceeds threshold`);
        }

        if (errorRate > this.thresholds.errorRateThreshold) {
            this.raiseAlert('HIGH_ERROR_RATE', `Error rate (${errorRate * 100}%) exceeds threshold`);
        }

        if (currentLoad > this.thresholds.highLoadThreshold) {
            this.raiseAlert('HIGH_LOAD', `Current load (${currentLoad} rpm) exceeds threshold`);
        }
    }

    raiseAlert(type, message) {
        const alert = {
            type,
            message,
            timestamp: new Date().toISOString(),
            metrics: { ...this.metrics }
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
    }

    getErrorRate() {
        return this.metrics.totalTransactions === 0 ? 0 :
            this.metrics.failedValidations / this.metrics.totalTransactions;
    }

    getCurrentLoad() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        return Array.from(this.minuteStats.values())
            .filter(stat => stat.timestamp > oneMinuteAgo)
            .reduce((sum, stat) => sum + stat.count, 0);
    }

    async optimizeMetrics() {
        // Remove old data
        const oneHourAgo = Date.now() - 3600000;
        for (const [minute, stat] of this.minuteStats.entries()) {
            if (stat.timestamp < oneHourAgo) {
                this.minuteStats.delete(minute);
            }
        }

        // Compact processing times array
        if (this.metrics.processingTimes.length > 1000) {
            const avgTime = this.getAverageProcessingTime();
            this.metrics.processingTimes = [avgTime];
        }
    }

    async generateHealthReport() {
        const report = {
            ...this.healthStatus,
            metrics: {
                averageLatency: this.getAverageProcessingTime(),
                errorRate: this.getErrorRate(),
                throughput: this.getCurrentLoad()
            },
            recommendations: []
        };

        if (report.metrics.averageLatency > this.thresholds.maxProcessingTime * 0.8) {
            report.recommendations.push('Consider scaling resources to improve latency');
        }

        return report;
    }
}

module.exports = new TransactionMonitor();
