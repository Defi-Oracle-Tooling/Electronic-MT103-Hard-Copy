const KeyRotationService = require('../../scripts/security/key_rotation_service');

describe('KeyRotationService', () => {
    beforeEach(() => {
        KeyRotationService.keyVersions.clear();
    });

    test('should generate new key on rotation', async () => {
        await KeyRotationService.rotateKeys();
        const { key, version } = KeyRotationService.getCurrentKey();
        
        expect(key).toBeDefined();
        expect(version).toBeLessThanOrEqual(Date.now());
    });

    test('should maintain maximum of 3 key versions', async () => {
        for (let i = 0; i < 5; i++) {
            await KeyRotationService.rotateKeys();
        }
        
        expect(KeyRotationService.keyVersions.size).toBe(3);
    });

    test('should emit keyRotated event', (done) => {
        KeyRotationService.once('keyRotated', ({ version }) => {
            expect(version).toBeDefined();
            done();
        });
        
        KeyRotationService.rotateKeys();
    });
});
