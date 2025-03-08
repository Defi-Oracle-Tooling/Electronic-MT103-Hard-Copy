import request from 'supertest';
import { app } from '@/app';
import { ComplianceService } from '@/services/compliance/compliance.service';
import { jest } from '@jest/globals';

describe('Compliance API Endpoints', () => {
  let token: string;

  beforeAll(async () => {
    token = await generateTestToken('COMPLIANCE_ADMIN');
  });

  describe('GET /api/compliance/status', () => {
    test('should return current compliance status', async () => {
      const response = await request(app)
        .get('/api/compliance/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        overall: expect.any(Number),
        categories: expect.any(Object),
        lastCheck: expect.any(String)
      });
    });
  });

  describe('POST /api/compliance/reports', () => {
    test('should generate compliance report', async () => {
      const response = await request(app)
        .post('/api/compliance/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'QUARTERLY',
          scope: ['GDPR', 'PSD2']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('reportId');
    });

    test('should validate report parameters', async () => {
      const response = await request(app)
        .post('/api/compliance/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid report type/i);
    });
  });
});
