export const RegionalRequirements = {
    'americas': {
        'us': {
            regulations: ['SEC', 'FINRA', 'SWIFT'],
            dateFormat: 'MM/DD/YYYY',
            numberFormat: {
                decimal: '.',
                thousands: ','
            }
        },
        'br': {
            regulations: ['BACEN', 'CVM', 'SWIFT'],
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimal: ',',
                thousands: '.'
            }
        },
        'mx': {
            regulations: ['CNBV', 'BANXICO', 'SWIFT'],
            dateFormat: 'DD/MM/YYYY',
            numberFormat: { decimal: '.', thousands: ',' },
            specificRequirements: ['AML_REQUIREMENTS', 'TAX_REPORTING']
        },
        'ca': {
            regulations: ['OSFI', 'FINTRAC', 'SWIFT'],
            dateFormat: 'YYYY-MM-DD',
            numberFormat: { decimal: '.', thousands: ',' },
            bilingual: true,
            translationRequirements: ['ENGLISH_FRENCH_PARITY']
        }
    },
    'asia': {
        'cn': {
            regulations: ['PBOC', 'SAFE', 'SWIFT'],
            dateFormat: 'YYYY年MM月DD日',
            numberFormat: {
                decimal: '.',
                thousands: ','
            }
        },
        'jp': {
            regulations: ['FSA', 'BOJ', 'SWIFT'],
            dateFormat: 'YYYY年MM月DD日',
            numberFormat: { decimal: '.', thousands: ',' },
            characterSets: ['KANJI', 'KANA'],
            transliteration: 'ROMAJI'
        },
        'sg': {
            regulations: ['MAS', 'SWIFT'],
            dateFormat: 'DD/MM/YYYY',
            numberFormat: { decimal: '.', thousands: ',' },
            multiLanguage: ['EN', 'ZH', 'MS', 'TA']
        }
    },
    'europe': {
        'eu': {
            regulations: ['EBA', 'ESMA', 'PSD2', 'GDPR', 'SWIFT'],
            dateFormat: 'DD/MM/YYYY',
            numberFormat: { decimal: ',', thousands: '.' },
            requiresConsentManagement: true
        }
    }
};
