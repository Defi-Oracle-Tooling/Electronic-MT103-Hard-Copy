const EventEmitter = require('events');
const bottleneckDetector = require('../performance/bottleneck_detector');
const logger = require('../mt103_logger');
const fs = require('fs').promises;
const path = require('path');
const mlService = require('../services/ml.service');
const { sendMetrics, sendAlert } = require('./metrics');

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
        
        // Enhanced with historical data for predictive scaling
        this.metricsHistory = [];
        this.historyLimit = 1000; // Store last 1000 data points
        this.predictionEnabled = true;
        
        this.loadHistoricalData();
        this.setupMonitoring();
        this.mlPredictor = new mlService.LoadPredictor();
        this.lastPrediction = null;

        this.thresholds = {
            cpu: 80,
            memory: 85,
            responseTime: 500,
            errorRate: 1
        };
        this.setupMetricsCollection();
    }

    async loadHistoricalData() {
        try {
            const dataPath = path.join(__dirname, '../../data/scaling-history.json');
            const rawData = await fs.readFile(dataPath, 'utf8');
            const historicalData = JSON.parse(rawData);
            
            // Validate and filter data
            this.metricsHistory = historicalData
                .filter(item => item && typeof item === 'object' && 'timestamp' in item)
                .slice(-this.historyLimit);
                
            logger.info(`Loaded ${this.metricsHistory.length} historical scaling metrics`);
        } catch (error) {
            logger.warn('Could not load historical scaling data', { error: error.message });
            this.metricsHistory = [];
        }
    }
    
    async persistHistoricalData() {
        try {
            const dataPath = path.join(__dirname, '../../data/scaling-history.json');
            await fs.writeFile(dataPath, JSON.stringify(this.metricsHistory), 'utf8');
        } catch (error) {
            logger.error('Failed to persist scaling history', { error: error.message });
        }
    }

    setupMonitoring() {
        bottleneckDetector.on('bottleneck', this.handleBottleneck.bind(this));
        
        // Regular metrics collection
        const metricsInterval = setInterval(async () => {
            const metrics = await this.collectMetrics();
            this.addMetricToHistory(metrics);
            
            // Predictive scaling check every 5 minutes
            if (this.metricsHistory.length > 0 && this.predictionEnabled) {
                const now = Date.now();
                if (now - this.lastScaleTime > this.scalingThresholds.cooldown) {
                    await this.checkPredictiveScaling();
                }
            }
        }, 60000); // Check every minute
        
        // Regular resource check
        const resourceInterval = setInterval(() => this.checkResources(), 60000);
        
        // Clean up intervals on process exit
        process.on('SIGTERM', () => {
            clearInterval(metricsInterval);
            clearInterval(resourceInterval);
            this.persistHistoricalData();
        });
    }
    
    addMetricToHistory(metric) {
        this.metricsHistory.push({
            ...metric,
            timestamp: Date.now()
        });
        
        // Trim history to limit
        if (this.metricsHistory.length > this.historyLimit) {
            this.metricsHistory.shift();
        }
        
        // Persist every 10 new metrics
        if (this.metricsHistory.length % 10 === 0) {
            this.persistHistoricalData();
        }
    }
    
    async collectMetrics() {
        const metrics = await bottleneckDetector.analyzePerformance();
        
        // Add additional business metrics
        try {
            const businessMetrics = await this.getBusinessMetrics();
            return { ...metrics, ...businessMetrics };
        } catch (error) {
            logger.error('Error collecting business metrics', { error: error.message });
            return metrics;
        }
    }
    
    async getBusinessMetrics() {
        // Implement to get transaction rate, error rate, etc.
        return {
            transactionRate: 0, // transactions per minute
            errorRate: 0,       // percentage
            responseTime: 0     // milliseconds
        };
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
        } else if (metrics.cpu < this.scalingThresholds.cpu * 0.4 && 
                   metrics.memory < this.scalingThresholds.memory * 0.4) {
            // Only scale down if well below thresholds
            await this.checkScaleDown();
        }
    }
    
    async checkPredictiveScaling() {
        // Skip if not enough data
        if (this.metricsHistory.length < 60) {
            return;
        }
        
        // Get time-of-day patterns
        const predictedLoad = await this.predictLoad(60); // Predict 60 minutes ahead
        
        if (predictedLoad > this.scalingThresholds.cpu) {
            // Preemptively scale up
            logger.info('Predictive scaling triggered', { 
                predictedLoad, 
                threshold: this.scalingThresholds.cpu 
            });
            await this.triggerScaling('up', 'PREDICTIVE');
        }
    }
    
    async predictLoad(minutesAhead) {
        try {
            const prediction = await this.mlPredictor.predict(this.metricsHistory, minutesAhead);
            this.lastPrediction = {
                value: prediction,
                timestamp: Date.now()
            };
            return prediction;
        } catch (error) {
            logger.error('Prediction failed', { error: error.message });
            return null;
        }
    }
    
    async checkScaleDown() {
        // Don't scale below minimum
        const currentReplicas = await this.getCurrentReplicas();
        if (currentReplicas <= this.scalingConfig.minInstances) {
            return;
        }
        
        // Check load trends before scaling down
        const recentMetrics = this.metricsHistory.slice(-30); // Last 30 minutes
        if (recentMetrics.length < 30) return;
        
        const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
        const avgMem = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;
        
        // Only scale down if consistently below thresholds
        if (avgCpu < this.scalingThresholds.cpu * 0.5 && avgMem < this.scalingThresholds.memory * 0.5) {
            await this.triggerScaling('down', 'RESOURCE_OPTIMIZATION');
        }
    }
    
    async getCurrentReplicas() {
        try {
            switch (this.scalingConfig.infrastructureType) {
                case 'kubernetes':
                    return this.getCurrentK8sReplicas();
                case 'docker':
                    // Implementation for Docker Swarm
                    return 1;
                case 'aws':
                    // Implementation for AWS scaling groups
                    return 1;
                default:
                    return 1;
            }
        } catch (error) {
            logger.error('Error getting current replicas', { error: error.message });
            return this.scalingConfig.minInstances;
        }
    }
    
    async getCurrentK8sReplicas() {
        const k8s = require('@kubernetes/client-node');
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        
        const api = kc.makeApiClient(k8s.AppsV1Api);
        try {
            const deployment = await api.readNamespacedDeployment('mt103-system', 'default');
            return deployment.body.spec.replicas;
        } catch (error) {
            logger.error('Error reading K8s deployment', { error: error.message });
            throw error;
        }
    }

    async triggerScaling(direction, reason) {
        const previousState = await this.getCurrentState();
        this.lastScaleTime = Date.now();
        
        try {
            await this.executeScaling(direction, reason);
            await sendMetrics('scaling_operation', {
                direction,
                reason,
                success: true
            });
        } catch (error) {
            logger.error('Scaling failed, initiating rollback', { error });
            try {
                await this.rollback(previousState);
            } catch (rollbackError) {
                logger.error('Rollback failed', { rollbackError });
                await sendAlert('CRITICAL: Scaling rollback failed');
            }
            throw error;
        }
    }

    async getCurrentState() {
        return {
            replicas: await this.getCurrentReplicas(),
            timestamp: Date.now(),
            metrics: await this.collectMetrics()
        };
    }

    async rollback(previousState) {
        logger.info('Rolling back to previous state', { previousState });
        switch (this.scalingConfig.infrastructureType) {
            case 'kubernetes':
                await this.rollbackKubernetes(previousState.replicas);
                break;
            // ...existing code...
        }
    }
    
    async sendMetrics(data) {
        try {
            await fetch(config.monitoring.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            logger.error('Failed to send metrics', { error });
        }
    }

    async sendAlert(message) {
        try {
            await fetch(config.monitoring.alertWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
        } catch (error) {
            logger.error('Failed to send alert', { error });
        }
    }

    async scaleKubernetes(direction) {
        const k8s = require('@kubernetes/client-node');
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        
        const api = kc.makeApiClient(k8s.AppsV1Api);
        const deployment = await api.readNamespacedDeployment('mt103-system', 'default');
        const currentReplicas = deployment.body.spec.replicas;
        
        let newReplicas = currentReplicas;
        if (direction === 'up' && currentReplicas < this.scalingConfig.maxInstances) {
            // Scale up by 50% rounded up, at least 1
            newReplicas = Math.min(
                this.scalingConfig.maxInstances,
                currentReplicas + Math.max(1, Math.ceil(currentReplicas * 0.5))
            );
        } else if (direction === 'down' && currentReplicas > this.scalingConfig.minInstances) {
            // Scale down by 1 only to be conservative
            newReplicas = currentReplicas - 1;
        }
        
        if (newReplicas !== currentReplicas) {
            logger.info('Scaling Kubernetes deployment', { 
                from: currentReplicas, 
                to: newReplicas 
            });
            
            await api.patchNamespacedDeployment('mt103-system', 'default', {
                spec: { replicas: newReplicas }
            });
        }
    }
    
    async scaleDockerSwarm(direction) {
        // Implementation for Docker Swarm scaling
        logger.info('Docker Swarm scaling not implemented');
    }
    
    async scaleAWS(direction) {
        // Implementation for AWS scaling
        logger.info('AWS scaling not implemented');
    }

    enhanceMonitoring() {
        // Add ML-based anomaly detection
        this.setupAnomalyDetection();
        
        // Add predictive alerting
        this.enablePredictiveAlerts();
        
        // Add enhanced metric correlation
        this.setupMetricCorrelation();
        
        // Add automated incident response
        this.setupAutomatedResponses();
    }

    setupMetricsCollection() {
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Every minute
    }

    async collectMetrics() {
        const metrics = await this.getSystemMetrics();
        this.metricsHistory.push({
            timestamp: Date.now(),
            ...metrics
        });

        if (this.metricsHistory.length > this.historyLimit) {
            this.metricsHistory.shift();
        }

        this.evaluateScaling(metrics);
    }
}

module.exports = new AutoScaler();
