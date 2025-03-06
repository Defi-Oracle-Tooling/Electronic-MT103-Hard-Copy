const EncryptionVerifier = require('../../scripts/security/encryption_verifier');
const crypto = require('crypto');

describe('EncryptionVerifier', () => {
    test('should verify encrypted data integrity', () => {
        const testData = Buffer.from('test data');
        const originalChecksum = crypto.createHash('sha256')
            .update(testData)
            .digest('hex');
            
        const result = EncryptionVerifier.verify(testData, originalChecksum);
        expect(result.isValid).toBe(true);
    });

    test('should verify message signatures', () => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048
        });
        
        const message = { test: 'data' };
        const signature = EncryptionVerifier.generateMessageSignature(message, privateKey);
        
        expect(EncryptionVerifier.verifyMessage(message, signature, publicKey)).toBe(true);
    });
});
