import { GDPRComplianceService } from '@/services/compliance/gdpr.service';
import { DataSubjectRequest } from '@/types/gdpr';

describe('GDPRComplianceService', () => {
  let service: GDPRComplianceService;

  beforeEach(() => {
    service = new GDPRComplianceService();
  });

  describe('Data Subject Rights', () => {
    const mockRequest: DataSubjectRequest = {
      type: 'ACCESS',
      subjectId: 'user123',
      timestamp: new Date(),
      data: {}
    };

    test('should handle access request', async () => {
      const result = await service.handleDataSubjectRequest(mockRequest);
      expect(result).toBeDefined();
    });

    test('should handle erasure request', async () => {
      const request = { ...mockRequest, type: 'ERASURE' as const };
      await expect(service.handleDataSubjectRequest(request)).resolves.not.toThrow();
    });
  });

  describe('Processing Basis Validation', () => {    
    test('should validate valid processing basis', async () => {
      const result = await service.validateProcessingBasis({
        type: 'CONSENT',
        details: { purpose: 'Payment Processing' }
      });
      expect(result).toBe(true);
    });

    test('should reject invalid processing basis', async () => {
      await expect(service.validateProcessingBasis({
        type: 'INVALID' as any,
        details: {}
      })).rejects.toThrow('Invalid processing basis');
    });
  });
});
