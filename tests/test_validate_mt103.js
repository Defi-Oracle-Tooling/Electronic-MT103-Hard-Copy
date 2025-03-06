const MT103Validator = require('../scripts/validate_mt103');

describe('MT103Validator', () => {
    test('validateSWIFTCode - valid code', () => {
        const result = MT103Validator.validateSWIFTCode('BOFAUS3NXXX');
        expect(result.isValid).toBe(true);
        expect(result.length).toBe(11);
    });

    test('validateAmount - valid amount', () => {
        const result = MT103Validator.validateAmount('1000,00');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('1000,00');
    });

    test('validateReference - valid reference', () => {
        const result = MT103Validator.validateReference('REF123456789');
        expect(result.isValid).toBe(true);
        expect(result.length).toBe(12);
    });
});
