/**
 * MT103 Message Validation Script
 * Validates SWIFT MT103 message fields according to ISO 15022 standards
 */

class MT103Validator {
    static validateSWIFTCode(code) {
        const pattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return {
            isValid: pattern.test(code),
            format: "BIC/SWIFT",
            length: code.length
        };
    }

    static validateAmount(amount) {
        const pattern = /^\d{1,15}(,\d{2})?$/;
        return {
            isValid: pattern.test(amount),
            format: "Amount",
            value: amount
        };
    }

    static validateReference(ref) {
        return {
            isValid: ref.length <= 16,
            format: "Reference",
            length: ref.length
        };
    }

    static validateValueDate(date) {
        const pattern = /^\d{6}$/;  // YYMMDD format
        const isValidFormat = pattern.test(date);
        if (!isValidFormat) return { isValid: false, error: 'Invalid date format' };

        const yy = parseInt(date.substring(0, 2));
        const mm = parseInt(date.substring(2, 4));
        const dd = parseInt(date.substring(4, 6));

        const currentDate = new Date();
        const inputDate = new Date(2000 + yy, mm - 1, dd);

        return {
            isValid: inputDate >= currentDate,
            format: "YYMMDD",
            value: date,
            error: inputDate >= currentDate ? null : 'Date cannot be in the past'
        };
    }

    static validateCurrency(currency) {
        const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];
        return {
            isValid: validCurrencies.includes(currency),
            format: "ISO 4217",
            value: currency
        };
    }

    static validateMessageId(messageId) {
        const pattern = /^[A-Za-z0-9-]{1,35}$/;
        return {
            isValid: pattern.test(messageId),
            format: "MessageId",
            value: messageId
        };
    }

    static validateFullMessage(mt103Data) {
        const errors = [];
        const validations = {
            messageId: this.validateMessageId(mt103Data.messageId),
            swift: this.validateSWIFTCode(mt103Data.senderBIC),
            amount: this.validateAmount(mt103Data.amount),
            currency: this.validateCurrency(mt103Data.currency),
            valueDate: this.validateValueDate(mt103Data.valueDate),
            reference: this.validateReference(mt103Data.reference)
        };

        Object.entries(validations).forEach(([field, result]) => {
            if (!result.isValid) {
                errors.push({
                    field,
                    error: result.error || `Invalid ${field}`,
                    value: result.value
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            validationDetails: validations
        };
    }
}

module.exports = MT103Validator;
