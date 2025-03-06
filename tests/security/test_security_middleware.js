const middleware = require('../../scripts/api/middleware');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

describe('Security Middleware', () => {
    const mockReq = {
        headers: {},
        body: {}
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    const mockNext = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('rate limiter should block excessive requests', async () => {
        const requests = Array(101).fill().map(() => 
            middleware.rateLimiter(mockReq, mockRes, mockNext)
        );
        
        await Promise.all(requests);
        expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    test('should verify valid JWT token', () => {
        const token = jwt.sign({ id: 'test' }, 'secret');
        mockReq.headers.authorization = `Bearer ${token}`;
        
        middleware.authenticateJWT(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    test('should validate message signatures', () => {
        const message = { test: 'data' };
        const hmac = crypto.createHmac('sha256', 'secret');
        hmac.update(JSON.stringify(message));
        const signature = hmac.digest('hex');

        mockReq.headers['x-message-signature'] = signature;
        mockReq.body = message;

        middleware.verifyMessageSignature(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
});
