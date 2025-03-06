const winston = require('winston');
const path = require('path');
const { trace, context, propagation } = require('@opentelemetry/api');

class MT103Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.errors({ stack: true })
            ),
            defaultMeta: { service: 'mt103-service' },
            transports: [
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/combined.log'),
                    maxsize: 5242880,
                    maxFiles: 5,
                })
            ]
        });

        this.securityTransport = new winston.transports.File({
            filename: path.join(__dirname, '../logs/security.log'),
            level: 'warn',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.metadata()
            )
        });

        this.logger.add(this.securityTransport);

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    logValidation(messageId, validationResult) {
        this.logger.info('Message Validation', {
            messageId,
            timestamp: new Date().toISOString(),
            result: validationResult
        });
    }

    logError(messageId, error) {
        this.logger.error('Validation Error', {
            messageId,
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });
    }

    logSecurity(messageId, event, metadata = {}) {
        const span = trace.getSpan(context.active());
        const traceId = span?.spanContext().traceId;
        
        this.logger.warn('Security Event', {
            messageId,
            event,
            timestamp: new Date().toISOString(),
            traceId,
            severity: this._calculateSeverity(event),
            ...metadata,
            fingerprint: this._generateEventFingerprint(event, metadata)
        });
    }

    _calculateSeverity(event) {
        const severityMap = {
            'INVALID_SIGNATURE': 'HIGH',
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'VALIDATION_FAILED': 'LOW'
        };
        return severityMap[event] || 'INFO';
    }

    _generateEventFingerprint(event, metadata) {
        const data = `${event}-${JSON.stringify(metadata)}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    logPerformance(messageId, duration, operation) {
        this.logger.info('Performance Metric', {
            messageId,
            duration,
            operation,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new MT103Logger();
