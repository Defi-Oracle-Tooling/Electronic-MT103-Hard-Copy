const winston = require('winston');
const path = require('path');

class MT103Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/mt103_error.log'),
                    level: 'error'
                }),
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/mt103_audit.log')
                })
            ]
        });
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
}

module.exports = new MT103Logger();
