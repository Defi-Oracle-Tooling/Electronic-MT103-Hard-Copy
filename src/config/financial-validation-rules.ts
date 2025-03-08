export const FinancialValidationRules = {
  termMatching: {
    strictness: 'high',
    requiredAccuracy: 0.95,
    contextAware: true
  },
  
  regulatoryCompliance: {
    frameworks: ['SWIFT', 'ISO20022', 'PSD2', 'FATF'],
    validationLevels: ['strict', 'warning', 'info'],
    enforceStandards: true
  },
  
  financialFormats: {
    amounts: {
      pattern: /^[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/,
      validation: 'strict'
    },
    accountNumbers: {
      pattern: /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/,
      validation: 'strict'
    },
    bic: {
      pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
      validation: 'strict'
    }
  },

  translationQuality: {
    minBLEUScore: 0.8,
    minTERScore: 0.7,
    contextMatchThreshold: 0.9
  },

  regulatoryValidation: {
    psd2: {
      requiredFields: ['IBAN', 'BIC', 'PURPOSE'],
      amountThresholds: {
        SCA_REQUIRED: 30000,
        ENHANCED_DUE_DILIGENCE: 100000
      },
      consentRequirements: ['EXPLICIT', 'GRANULAR', 'TIME_BOUND']
    },
    aml: {
      screeningRequirements: ['SENDER', 'BENEFICIARY', 'INTERMEDIARIES'],
      thresholds: {
        STANDARD_CHECK: 10000,
        ENHANCED_CHECK: 50000,
        FULL_INVESTIGATION: 100000
      },
      requiredDocumentation: ['SOURCE_OF_FUNDS', 'PURPOSE_OF_PAYMENT']
    },
    fatf: {
      travelRule: {
        enabled: true,
        threshold: 1000,
        requiredData: ['ORIGINATOR', 'BENEFICIARY', 'TRANSACTION_PURPOSE']
      }
    }
  },

  crossBorderValidation: {
    requiredChecks: ['SANCTIONS', 'PEP', 'HIGH_RISK_COUNTRIES'],
    documentationRequirements: {
      LOW_RISK: ['BASIC_KYC'],
      MEDIUM_RISK: ['ENHANCED_KYC', 'SOURCE_OF_FUNDS'],
      HIGH_RISK: ['FULL_DUE_DILIGENCE', 'SENIOR_APPROVAL']
    }
  }
};
