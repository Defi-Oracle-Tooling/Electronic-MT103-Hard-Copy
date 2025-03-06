const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createHmac } = require('crypto');
const xss = require('xss');
const Redis = require('ioredis');
const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const HMAC_SECRET = process.env.HMAC_SECRET || crypto.randomBytes(32).toString('hex');

const redis = new Redis(process.env.REDIS_URL);

exports.rateLimiter = new RateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

exports.authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authentication token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

exports.verifyMessageSignature = (req, res, next) => {
    const signature = req.headers['x-message-signature'];
    if (!signature) {
        return res.status(400).json({ error: 'Missing message signature' });
    }

    const hmac = createHmac('sha256', HMAC_SECRET);
    hmac.update(JSON.stringify(req.body));
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
        return res.status(400).json({ error: 'Invalid message signature' });
    }
    next();
};

exports.sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key].trim());
            }
        });
    }
    next();
};

exports.validateRequest = (req, res, next) => {
    const requiredFields = ['messageId', 'senderBIC', 'amount', 'currency', 'valueDate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Missing required fields',
            fields: missingFields
        });
    }
    next();
};

exports.validateMessageStructure = (req, res, next) => {
    const validFields = new Set([
        'messageId', 'senderBIC', 'amount', 'currency', 'valueDate',
        'reference', 'beneficiaryName', 'beneficiaryAccount'
    ]);

    const invalidFields = Object.keys(req.body).filter(field => !validFields.has(field));
    if (invalidFields.length > 0) {
        return res.status(400).json({
            error: 'Invalid fields present',
            invalidFields
        });
    }
    next();
};

exports.requireRole = (role) => (req, res, next) => {
    if (!req.user.roles?.includes(role)) {
        logger.logError(null, { error: 'Unauthorized role access attempt', role, userId: req.user.id });
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

exports.detectSecurityBreach = (req, res, next) => {
    const suspiciousPatterns = [
        /union\s+select/i,
        /<script>/i,
        /exec\s+xp_/i
    ];

    const requestData = JSON.stringify(req.body);
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

    if (isSuspicious) {
        logger.logError(null, {
            error: 'Potential security breach detected',
            ip: req.ip,
            userId: req.user?.id,
            data: requestData
        });
        return res.status(400).json({ error: 'Invalid request data' });
    }
    next();
};
