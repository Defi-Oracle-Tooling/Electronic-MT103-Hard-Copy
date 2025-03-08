const express = require('express');
const router = express.Router();
const MT103Validator = require('../validate_mt103');
const logger = require('../mt103_logger');
const { authenticateJWT, validateRequest } = require('./middleware');
const rateLimit = require('express-rate-limit');
const messageStore = require('../message_store');
const transactionMonitor = require('../monitoring/transaction_monitor');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/validate', 
    apiLimiter,
    authenticateJWT,
    validateRequest,
    async (req, res) => {
        try {
            const validationResult = MT103Validator.validateFullMessage(req.body);
            logger.logValidation(req.body.messageId, validationResult);
            res.json(validationResult);
        } catch (error) {
            logger.logError(req.body.messageId, error);
            res.status(500).json({ error: 'Validation failed' });
        }
    }
);

router.post('/submit',
    apiLimiter,
    authenticateJWT,
    validateRequest,
    validateMessageStructure,
    verifyMessageSignature,
    sanitizeInput,
    async (req, res) => {
        try {
            const validationResult = MT103Validator.validateFullMessage(req.body);
            if (!validationResult.isValid) {
                return res.status(400).json(validationResult);
            }

            const messageId = await messageStore.create({
                ...req.body,
                status: 'pending',
                submittedBy: req.user.id,
                submittedAt: new Date().toISOString()
            });
            
            res.json({
                messageId,
                status: 'accepted',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.logError(req.body.messageId, error);
            res.status(500).json({ error: 'Message submission failed' });
        }
    }
);

router.get('/status/:messageId',
    apiLimiter,
    authenticateJWT,
    async (req, res) => {
        try {
            const messageId = req.params.messageId;
            const status = await messageStore.getStatus(messageId);
            
            if (!status) {
                return res.status(404).json({ error: 'Message not found' });
            }
            
            res.json(status);
        } catch (error) {
            logger.logError(req.params.messageId, error);
            res.status(500).json({ error: 'Status check failed' });
        }
    }
);

router.get('/audit/:messageId',
    apiLimiter,
    authenticateJWT,
    requireRole('AUDITOR'),
    async (req, res) => {
        try {
            const auditTrail = await messageStore.getAuditTrail(req.params.messageId);
            if (!auditTrail.length) {
                return res.status(404).json({ error: 'No audit trail found' });
            }
            res.json({ auditTrail });
        } catch (error) {
            logger.logError(req.params.messageId, error);
            res.status(500).json({ error: 'Audit trail retrieval failed' });
        }
    }
);

router.post('/monitor',
    apiLimiter,
    authenticateJWT,
    requireRole('MONITOR'),
    (req, res) => {
        const { type, callback } = req.body;
        const unsubscribe = messageStore.registerMonitor(event => {
            if (!type || event.type === type) {
                callback(event);
            }
        });
        res.json({ status: 'Monitoring established' });
    }
);

router.get('/metrics',
    apiLimiter,
    authenticateJWT,
    requireRole('ADMIN'),
    (req, res) => {
        const metrics = {
            ...transactionMonitor.metrics,
            averageProcessingTime: transactionMonitor.getAverageProcessingTime()
        };
        res.json(metrics);
    }
);

router.get('/alerts',
    apiLimiter,
    authenticateJWT,
    requireRole('ADMIN'),
    (req, res) => {
        const { from, to } = req.query;
        let alerts = transactionMonitor.alerts;
        
        if (from || to) {
            alerts = alerts.filter(alert => {
                const timestamp = new Date(alert.timestamp);
                return (!from || timestamp >= new Date(from)) &&
                       (!to || timestamp <= new Date(to));
            });
        }
        
        res.json({ alerts });
    }
);

router.get('/performance',
    apiLimiter,
    authenticateJWT,
    requireRole('ADMIN'),
    (req, res) => {
        const metrics = {
            current: {
                avgProcessingTime: transactionMonitor.getAverageProcessingTime(),
                errorRate: transactionMonitor.getErrorRate(),
                load: transactionMonitor.getCurrentLoad()
            },
            thresholds: transactionMonitor.thresholds,
            trends: Array.from(transactionMonitor.minuteStats.values())
                .slice(-60) // Last hour
        };
        res.json(metrics);
    }
);

router.get('/health',
    async (req, res) => {
        const healthChecker = require('../monitoring/health_checker');
        const results = await healthChecker.runHealthCheck();
        
        const overallStatus = Object.values(results)
            .every(r => r.status === 'healthy') ? 'healthy' : 'degraded';
        
        const health = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: results,
            metrics: {
                ...transactionMonitor.metrics,
                averageProcessingTime: transactionMonitor.getAverageProcessingTime()
            }
        };
        
        res.status(overallStatus === 'healthy' ? 200 : 503)
           .json(health);
    }
);

module.exports = router;
