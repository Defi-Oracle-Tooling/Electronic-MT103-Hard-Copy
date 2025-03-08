export const TranslationRules = {
    'zh-cn': {
        nameOrder: 'eastern', // Last name first
        honorifics: true,
        currencyFormat: 'symbol-after',
        transliterationRules: ['pinyin']
    },
    'ja': {
        nameOrder: 'eastern',
        honorifics: true,
        currencyFormat: 'symbol-before',
        transliterationRules: ['romaji']
    },
    'ar': {
        direction: 'rtl',
        numerals: 'arabic',
        dateFormat: 'hijri',
        transliterationRules: ['buckwalter']
    }
    // Add other languages...
};
