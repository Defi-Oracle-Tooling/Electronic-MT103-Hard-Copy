import request from 'supertest';
import { app } from '@/app';

describe('Compliance Workflow Tests', () => {
  let token: string;

  beforeAll(async () => {
    token = await generateTestToken('COMPLIANCE_ADMIN');
  });

  describe('Cross-Border Transaction Workflow', () => {
    test('should handle complete AML verification flow', async () => {
      // Initial screening
      const screeningResponse = await request(app)
        .post('/api/compliance/aml/screen')
        .set('Authorization', `Bearer ${token}`)
        .send({
          transactionId: 'TX123',
          parties: ['SENDING_BANK', 'BENEFICIARY'],
          amount: 1000000,
          currency: 'USD'
        });

      expect(screeningResponse.status).toBe(200);
      const { screeningId } = screeningResponse.body;

      // Risk assessment
      const riskResponse = await request(app)
        .post(`/api/compliance/aml/risk-assessment/${screeningId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(riskResponse.body.riskLevel).toBe('HIGH');
      expect(riskResponse.body.requiredChecks).toContain('ENHANCED_DUE_DILIGENCE');

      // Final verification
      const verificationResponse = await request(app)
        .post(`/api/compliance/aml/verify/${screeningId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eddDocuments: ['KYC_DOC', 'SOURCE_OF_FUNDS'],
          approverNotes: 'Documentation verified'
        });

      expect(verificationResponse.status).toBe(200);
      expect(verificationResponse.body.status).toBe('APPROVED');
    });
  });

  describe('Multi-Jurisdiction Compliance Flow', () => {
    test('should handle cross-border regulatory requirements', async () => {
      const response = await request(app)
        .post('/api/compliance/multi-jurisdiction/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fromJurisdiction: 'EU',
          toJurisdiction: 'US',
          amount: 1000000,
          transactionType: 'SWIFT_MT103'
        });

      expect(response.status).toBe(200);
      expect(response.body.validations).toContain('GDPR');
      expect(response.body.validations).toContain('FATCA');
    });

    test('should enforce jurisdiction-specific thresholds', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/compliance/threshold-check')
          .send({ jurisdiction: 'US', amount: 10000 }),
        request(app)
          .post('/api/compliance/threshold-check')
          .send({ jurisdiction: 'EU', amount: 15000 })
      ]);

      responses.forEach(response => {
        expect(response.body.requiresEnhancedDueDiligence).toBeDefined();
      });
    });
  });
});
