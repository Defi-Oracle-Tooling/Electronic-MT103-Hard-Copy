const transactionMonitor = require('../../scripts/monitoring/transaction_monitor');

describe('TransactionMonitor', () => {
    beforeEach(() => {
        transactionMonitor.metrics = {
            totalTransactions: 0,
            failedValidations: 0,
            processingTimes: [],
            lastProcessed: null
        };
        transactionMonitor.alerts = [];
        transactionMonitor.minuteStats.clear();
    });

    test('should track processing time correctly', () => {
        const startTime = Date.now() - 100; // Simulate 100ms processing time
        const duration = transactionMonitor.trackProcessingTime(startTime);
        expect(duration).toBeGreaterThanOrEqual(100);
        expect(transactionMonitor.metrics.processingTimes).toHaveLength(1);
    });

    test('should raise alert when thresholds exceeded', () => {
        // Simulate high latency
        for (let i = 0; i < 10; i++) {
            transactionMonitor.metrics.processingTimes.push(2000);
        }
        
        transactionMonitor.checkThresholds();
        expect(transactionMonitor.alerts).toHaveLength(1);
        expect(transactionMonitor.alerts[0].type).toBe('HIGH_LATENCY');
    });
});
