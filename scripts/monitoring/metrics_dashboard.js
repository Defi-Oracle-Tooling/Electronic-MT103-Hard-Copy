const { Gauge, Counter, register, Histogram } = require('prom-client');
const express = require('express');

class MetricsDashboard {
    constructor() {
        this.setupMetrics();
        this.setupEndpoint();
    }

    setupMetrics() {
        this.transactionGauge = new Gauge({
            name: 'mt103_transactions_total',
            help: 'Total number of MT103 transactions'
        });

        this.processingTimeHistogram = new Gauge({
            name: 'mt103_processing_time_ms',
            help: 'Transaction processing time in milliseconds'
        });

        this.errorCounter = new Counter({
            name: 'mt103_errors_total',
            help: 'Total number of transaction errors'
        });

        // Add new metrics
        this.hsmLatencyHistogram = new Histogram({
            name: 'mt103_hsm_latency',
            help: 'HSM operation latency in milliseconds',
            buckets: [10, 50, 100, 200, 500]
        });

        this.messageProcessingHistogram = new Histogram({
            name: 'mt103_message_processing_duration',
            help: 'Message processing duration in milliseconds',
            labelNames: ['status', 'type']
        });

        this.securityEventsCounter = new Counter({
            name: 'mt103_security_events',
            help: 'Security-related events counter',
            labelNames: ['event_type', 'severity']
        });
    }

    setupEndpoint() {
        const router = express.Router();
        
        router.get('/metrics', async (req, res) => {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        });

        return router;
    }

    async exportToGrafana() {
        const metrics = await register.getMetricsAsJSON();
        const grafanaUrl = process.env.GRAFANA_URL;
        const apiKey = process.env.GRAFANA_API_KEY;

        if (grafanaUrl && apiKey) {
            try {
                await fetch(`${grafanaUrl}/api/datasources/proxy/1/api/v1/write`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(metrics)
                });
            } catch (error) {
                logger.error('Grafana export failed', { error });
            }
        }
    }

    updateMetrics(metrics) {
        this.transactionGauge.set(metrics.totalTransactions);
        this.processingTimeHistogram.set(metrics.averageProcessingTime);
        if (metrics.errors) this.errorCounter.inc(metrics.errors);
    }
}

module.exports = new MetricsDashboard();
