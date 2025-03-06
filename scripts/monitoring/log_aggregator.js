const winston = require('winston');
const path = require('path');
const { ElasticsearchTransport } = require('winston-elasticsearch');

class LogAggregator {
    constructor() {
        this.logStorage = new Map();
        this.setupAggregation();
    }

    setupAggregation() {
        const transports = [
            new winston.transports.File({
                filename: path.join(__dirname, '../../logs/aggregated.log')
            })
        ];

        if (process.env.ELASTICSEARCH_URL) {
            transports.push(new ElasticsearchTransport({
                level: 'info',
                clientOpts: { node: process.env.ELASTICSEARCH_URL },
                index: 'mt103-logs',
                indexPrefix: 'mt103',
                indexSuffixPattern: 'YYYY.MM'
            }));
        }

        if (process.env.LOKI_URL) {
            transports.push(require('winston-loki').LokiTransport({
                host: process.env.LOKI_URL,
                labels: { job: 'mt103_system' }
            }));
        }

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports
        });
    }

    async aggregateMetrics(metrics) {
        const timestamp = new Date().toISOString();
        await this.logger.info('Aggregated Metrics', {
            ...metrics,
            timestamp,
            source: 'mt103-system'
        });
    }

    async retentionCheck() {
        const retentionDays = process.env.LOG_RETENTION_DAYS || 365;
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - retentionDays);

        await this.logger.query({
            from: 0,
            until: retentionDate,
            limit: 1000
        }, (err, results) => {
            if (err) {
                logger.error('Log retention check failed', { error: err });
                return;
            }
            // Process retention cleanup
        });
    }
}

module.exports = new LogAggregator();
