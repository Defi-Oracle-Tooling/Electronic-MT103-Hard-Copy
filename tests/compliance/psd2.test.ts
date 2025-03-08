import { PSD2ComplianceService } from '@/services/compliance/psd2.service';

describe('PSD2ComplianceService', () => {
  let service: PSD2ComplianceService;

  beforeEach(() => {
    service = new PSD2ComplianceService();
  });

  describe('Strong Customer Authentication', () => {
    test('should require SCA for high-risk transactions', async () => {
      const transaction = {
        amount: 100000,
        currency: 'EUR',
        beneficiary: 'test-bank',
        type: 'CROSS_BORDER'
      };

      const result = await service.validateSCA(transaction);
      expect(result).toBe(true);
    });

    test('should validate consent correctly', async () => {
      const result = await service.validateConsent('account123', 'READ');
      expect(result).toBe(true);
    });
  });

  describe('API Access', () => {
    test('should setup TPP access with valid certificate', async () => {
      const result = await service.setupAPIAccess('tpp123');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('apiEndpoints');
    });
  });
});
