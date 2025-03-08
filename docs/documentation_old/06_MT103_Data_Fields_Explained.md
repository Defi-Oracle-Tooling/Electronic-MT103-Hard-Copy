# MT103 Data Fields Explained

A comprehensive guide to SWIFT MT103 message fields and their requirements.

### 1. Mandatory Fields

| Field | Name | Format | Required | Description |
|-------|------|--------|----------|-------------|
| :20:  | Transaction Reference | 16x | Yes | Unique reference assigned by sender |
| :23B: | Bank Operation Code | 4!c | Yes | Must be "CRED" for credit transfer |
| :32A: | Value Date/Currency/Amount | 6!n3!a15d | Yes | YYMMDD + Currency + Amount |
| :50K: | Ordering Customer | 35x | Yes | Account number + Name + Address |
| :59:  | Beneficiary | 35x | Yes | Account number + Name + Address |

### 2. Optional Fields

| Field | Name | Format | Description |
|-------|------|--------|-------------|
| :52A: | Ordering Institution | [/1!a][/34x] | BIC of sender's bank |
| :53A: | Sender's Correspondent | [/1!a][/34x] | Intermediary bank details |
| :54A: | Receiver's Correspondent | [/1!a][/34x] | Secondary intermediary |
| :70:  | Remittance Information | 4*35x | Payment details/invoice numbers |
| :71A: | Details of Charges | 3!a | Who pays transfer charges |

### 3. Format Specifications

- **!** = Fixed length
- **n** = Numeric digits only
- **a** = Letters only
- **x** = Any character
- **d** = Decimal number
- **c** = SWIFT character set

### 4. Field Examples

```swift
:20:REFERENCE123456
:23B:CRED
:32A:230901USD1000000,00
:50K:/12345678
JOHN DOE
123 MAIN STREET, NY
:59:/87654321
JANE SMITH
456 HIGH STREET, LONDON
```

### 5. Validation Requirements

- All amounts must be positive
- Dates must be valid and not in the past
- BIC/SWIFT codes must be registered in the SWIFT network
- Account numbers must match the specified format for each country
