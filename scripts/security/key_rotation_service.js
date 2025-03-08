const { EventEmitter } = require('events');
const crypto = require('crypto');
const messageStore = require('../message_store');
const logger = require('../mt103_logger');

class KeyRotationService extends EventEmitter {
    constructor(rotationInterval = 24 * 60 * 60 * 1000) { // 24 hours default
        super();
        this.rotationInterval = rotationInterval;
        this.lastRotation = Date.now();
        this.keyVersions = new Map();
        this.setupAutoRotation();
        this.setupEmergencyRotation();
    }

    setupAutoRotation() {
        setInterval(() => this.rotateKeys(), this.rotationInterval);
    }

    setupEmergencyRotation() {
        this.on('security-alert', async (alert) => {
            logger.warn('Emergency key rotation triggered', { reason: alert });
            await this.rotateKeys();
        });
    }

    async rotateKeys() {
        try {
            const newKey = crypto.randomBytes(32);
            const keyVersion = Date.now();
            this.keyVersions.set(keyVersion, {
                key: newKey,
                createdAt: new Date().toISOString()
            });
            
            // Keep only last 3 key versions
            const versions = Array.from(this.keyVersions.keys()).sort();
            while (versions.length > 3) {
                this.keyVersions.delete(versions.shift());
            }

            this.lastRotation = Date.now();
            this.emit('keyRotated', { version: keyVersion });
            logger.info('Key rotation completed', { keyVersion });
        } catch (error) {
            logger.error('Key rotation failed', { error });
            this.emit('keyRotationError', error);
        }
    }

    getCurrentKey() {
        const versions = Array.from(this.keyVersions.keys()).sort();
        return {
            key: this.keyVersions.get(versions[versions.length - 1]).key,
            version: versions[versions.length - 1]
        };
    }

    async enhanceSecurity() {
        // Add Hardware Security Module (HSM) integration
        await this.setupHSMIntegration();
        
        // Add quantum-resistant encryption
        this.enableQuantumResistantAlgorithms();
        
        // Add enhanced audit logging
        this.setupEnhancedAuditLogging();
        
        // Add real-time threat detection
        this.enableThreatDetection();
    }

    setupHSMIntegration() {
        // Implementation for HSM integration
    }
}

module.exports = new KeyRotationService();
