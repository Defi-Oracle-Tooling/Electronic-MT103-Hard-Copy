# MT103 Validation Scripts

### 1. SWIFT Code Validator
```javascript
function validateSWIFT(code) {
    const swiftPattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return {
        isValid: swiftPattern.test(code),
        length: code.length,
        bankCode: code.substring(0, 4),
        countryCode: code.substring(4, 6)
    };
}
```

### 2. Amount Format Validator
```javascript
function validateAmount(amount, currency) {
    const amountPattern = /^\d{1,15}(,\d{2})?$/;
    const currencyPattern = /^[A-Z]{3}$/;
    return {
        isValid: amountPattern.test(amount) && currencyPattern.test(currency),
        formatted: `${currency}${amount}`
    };
}
```

### 3. Complete MT103 Validator
[Additional validation scripts for the complete message structure]
