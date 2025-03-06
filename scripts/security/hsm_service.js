const crypto = require('crypto');
const logger = require('../mt103_logger');

class HSMService {
    constructor() {
        this.hsmConfig = {
            partition: process.env.HSM_PARTITION,
            slotId: parseInt(process.env.HSM_SLOT_ID || '0'),
            pin: process.env.HSM_PIN
        };
        this.hsmClient = this.initializeHSMClient();
    }

    initializeHSMClient() {
        // Support multiple HSM providers
        switch (process.env.HSM_PROVIDER) {
            case 'aws':
                return new (require('aws-sdk')).CloudHSM();
            case 'gemalto':
                return require('gemalto-hsm-client');
            default:
                return this.createSoftHSM();
        }
    }

    async generateKey() {
        try {
            const keyId = await this.hsmClient.generateKey({
                KeySpec: 'RSA_2048',
                Origin: 'HSM'
            });
            logger.info('HSM key generated', { keyId });
            return keyId;
        } catch (error) {
            logger.error('HSM key generation failed', { error });
            throw error;
        }
    }

    async signWithHSM(data, keyId) {
        try {
            const signature = await this.hsmClient.sign({
                KeyId: keyId,
                Message: Buffer.from(JSON.stringify(data)),
                SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
            });
            return signature;
        } catch (error) {
            logger.error('HSM signing failed', { error });
            throw error;
        }
    }

    async signTransaction(transaction) {
        try {
            // Simulate HSM signing operation
            const sign = crypto.createSign('SHA256');
            sign.update(JSON.stringify(transaction));
            return sign.sign(process.env.HSM_PRIVATE_KEY);
        } catch (error) {
            logger.error('HSM signing failed', { error });
            throw new Error('HSM operation failed');
        }
    }

    async verifySignature(data, signature, publicKey) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(JSON.stringify(data));
            return verify.verify(publicKey, signature);
        } catch (error) {
            logger.error('HSM verification failed', { error });
            return false;
        }
    }
}

module.exports = new HSMService();
