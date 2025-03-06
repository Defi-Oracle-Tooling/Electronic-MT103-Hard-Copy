const EventEmitter = require('events');
const bottleneckDetector = require('../performance/bottleneck_detector');
const logger = require('../mt103_logger');

class AutoScaler extends EventEmitter {
    constructor() {
        super();
        this.scalingStatus = 'stable';
        this.scalingThresholds = {
            cpu: 75,    // Scale up at 75% CPU
            memory: 80, // Scale up at 80% memory
            cooldown: 300000 // 5 min cooldown between scaling
        };
        this.lastScaleTime = 0;
        this.scalingConfig = {
            minInstances: 2,
            maxInstances: 10,
            scaleUpThreshold: 0.75,
            scaleDownThreshold: 0.25,
            infrastructureType: process.env.INFRA_TYPE || 'kubernetes'
        };
        this.setupMonitoring();
    }

    setupMonitoring() {
        bottleneckDetector.on('bottleneck', this.handleBottleneck.bind(this));
        setInterval(() => this.checkResources(), 60000); // Check every minute
    }

    async handleBottleneck(data) {
        if (Date.now() - this.lastScaleTime < this.scalingThresholds.cooldown) {
            return; // Still in cooldown period
        }

        await this.triggerScaling('up', data.type);
    }

    async checkResources() {
        const metrics = await bottleneckDetector.analyzePerformance();
        
        if (metrics.cpu > this.scalingThresholds.cpu || 
            metrics.memory > this.scalingThresholds.memory) {
            await this.triggerScaling('up', 'RESOURCE_THRESHOLD');
        }
    }

    async triggerScaling(direction, reason) {
        this.lastScaleTime = Date.now();
        this.scalingStatus = 'scaling';
        
        this.emit('scaling', {
            direction,
            reason,
            timestamp: new Date().toISOString()
        });

        logger.info('Auto-scaling triggered', {
            direction,
            reason,
            timestamp: new Date().toISOString()
        });
        
        switch (this.scalingConfig.infrastructureType) {
            case 'kubernetes':
                await this.scaleKubernetes(direction);
                break;
            case 'docker':
                await this.scaleDockerSwarm(direction);
                break;
            case 'aws':
                await this.scaleAWS(direction);
                break;
        }
    }

    async scaleKubernetes(direction) {
        const k8s = require('@kubernetes/client-node');
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        
        const api = kc.makeApiClient(k8s.AppsV1Api);
        const deployment = await api.readNamespacedDeployment('mt103-system', 'default');
        const currentReplicas = deployment.body.spec.replicas;
        
        if (direction === 'up' && currentReplicas < this.scalingConfig.maxInstances) {
            await api.patchNamespacedDeployment('mt103-system', 'default', {
                spec: { replicas: currentReplicas + 1 }
            });
        }
    }
}

module.exports = new AutoScaler();
