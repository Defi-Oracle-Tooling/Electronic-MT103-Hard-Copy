const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const transactionMonitor = require('./monitoring/transaction_monitor');

class MessageStore {
    constructor() {
        this.messages = new Map();
        this.encryptionKey = process.env.STORE_KEY || crypto.randomBytes(32);
        this.auditLog = new Map();
        this.monitoringCallbacks = new Set();
    }

    async create(message) {
        const startTime = Date.now();
        try {
            const encryptedMessage = await this.encryptMessage(message);
            this.messages.set(message.messageId, {
                data: encryptedMessage,
                status: message.status,
                timestamp: new Date().toISOString()
            });
            this.logAuditEvent(message.messageId, 'CREATE', message.submittedBy);
            this.notifyMonitors({ type: 'CREATE', messageId: message.messageId });
            transactionMonitor.metrics.totalTransactions++;
            transactionMonitor.metrics.lastProcessed = new Date().toISOString();
            transactionMonitor.trackProcessingTime(startTime);

            // Track minute-based statistics
            const minute = Math.floor(startTime / 60000);
            if (!transactionMonitor.minuteStats.has(minute)) {
                transactionMonitor.minuteStats.set(minute, {
                    timestamp: startTime,
                    count: 0,
                    errors: 0,
                    avgProcessingTime: 0
                });
            }
            const stats = transactionMonitor.minuteStats.get(minute);
            stats.count++;
            stats.avgProcessingTime = (stats.avgProcessingTime * (stats.count - 1) + 
                transactionMonitor.trackProcessingTime(startTime)) / stats.count;

            // Check thresholds after update
            transactionMonitor.checkThresholds();
            
            return message.messageId;
        } catch (error) {
            transactionMonitor.metrics.failedValidations++;
            const minute = Math.floor(Date.now() / 60000);
            const stats = transactionMonitor.minuteStats.get(minute);
            if (stats) stats.errors++;
            throw error;
        }
    }

    async getStatus(messageId) {
        const message = this.messages.get(messageId);
        if (!message) return null;
        return {
            messageId,
            status: message.status,
            timestamp: message.timestamp
        };
    }

    async encryptMessage(message) {
        const iv = crypto.randomBytes(16);
        const salt = crypto.randomBytes(16);
        const key = await scrypt(this.encryptionKey, salt, 32);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(message)),
            cipher.final()
        ]);
        
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            salt: salt.toString('base64'),
            tag: cipher.getAuthTag().toString('base64')
        };
    }

    logAuditEvent(messageId, action, userId) {
        const event = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            messageId,
            ip: this.currentRequest?.ip
        };
        
        if (!this.auditLog.has(messageId)) {
            this.auditLog.set(messageId, []);
        }
        this.auditLog.get(messageId).push(event);
    }

    registerMonitor(callback) {
        this.monitoringCallbacks.add(callback);
        return () => this.monitoringCallbacks.delete(callback);
    }

    notifyMonitors(event) {
        this.monitoringCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Monitor callback failed:', error);
            }
        });
    }

    getAuditTrail(messageId) {
        return this.auditLog.get(messageId) || [];
    }
}

module.exports = new MessageStore();
