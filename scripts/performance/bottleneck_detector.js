const EventEmitter = require('events');

class BottleneckDetector extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.thresholds = {
            cpuUsage: 80,
            memoryUsage: 85,
            responseTime: 1000
        };
    }

    async analyzePerformance() {
        const usage = process.cpuUsage();
        const memory = process.memoryUsage();
        
        const metrics = {
            cpu: (usage.user + usage.system) / 1000000,
            memory: (memory.heapUsed / memory.heapTotal) * 100,
            timestamp: Date.now()
        };

        this.metrics.set(Date.now(), metrics);
        
        if (metrics.cpu > this.thresholds.cpuUsage) {
            this.emit('bottleneck', {
                type: 'CPU_BOTTLENECK',
                value: metrics.cpu,
                recommendation: 'Consider scaling horizontally'
            });
        }

        return metrics;
    }

    async optimize() {
        global.gc && global.gc();
        this.metrics.clear();
        return true;
    }
}

module.exports = new BottleneckDetector();
