const crypto = require('crypto');

class MT103Encryptor {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = crypto.randomBytes(32);
    }

    encryptMessage(mt103Data) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            const data = typeof mt103Data === 'string' ? 
                mt103Data : JSON.stringify(mt103Data);
            
            let encrypted = cipher.update(data, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            return {
                encrypted,
                iv: iv.toString('base64'),
                authTag: cipher.getAuthTag().toString('base64')
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Encryption failed');
        }
    }

    decryptMessage(encryptedData) {
        try {
            const decipher = crypto.createDecipheriv(
                this.algorithm, 
                this.key,
                Buffer.from(encryptedData.iv, 'base64')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            return { error: `Decryption failed: ${error.message}` };
        }
    }
}

module.exports = new MT103Encryptor();
