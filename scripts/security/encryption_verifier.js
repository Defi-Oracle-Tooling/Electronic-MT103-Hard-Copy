const crypto = require('crypto');
const logger = require('../mt103_logger');

class EncryptionVerifier {
    static verify(encryptedData, originalChecksum) {
        const checksum = crypto.createHash('sha256')
            .update(encryptedData)
            .digest('hex');
            
        return {
            isValid: checksum === originalChecksum,
            currentChecksum: checksum,
            expectedChecksum: originalChecksum
        };
    }

    static verifyMessage(message, signature, publicKey) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(JSON.stringify(message));
            return verify.verify(publicKey, Buffer.from(signature, 'base64'));
        } catch (error) {
            logger.error('Message verification failed', { error });
            return false;
        }
    }

    static generateMessageSignature(message, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(JSON.stringify(message));
        return sign.sign(privateKey).toString('base64');
    }
}

module.exports = EncryptionVerifier;
