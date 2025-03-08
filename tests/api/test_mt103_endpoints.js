require('dotenv').config({ path: './test.env' });

const request = require('supertest');
const app = require('../../scripts/api/server');
const jwt = require('jsonwebtoken');

describe('MT103 API Endpoints', () => {
    const testToken = jwt.sign(
        { id: 'testUser', roles: ['ADMIN'] }, 
        process.env.TEST_JWT_SECRET
    );

    test('should get monitoring metrics', async () => {
        const response = await request(app)
            .get('/api/v1/mt103/metrics')
            .set('Authorization', `Bearer ${testToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalTransactions');
        expect(response.body).toHaveProperty('averageProcessingTime');
    });

    test('should get alerts with date filtering', async () => {
        const response = await request(app)
            .get('/api/v1/mt103/alerts')
            .query({ from: '2024-01-01', to: '2024-12-31' })
            .set('Authorization', `Bearer ${testToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.alerts)).toBe(true);
    });
});
