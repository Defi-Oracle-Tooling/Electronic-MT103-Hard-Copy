import { join } from 'path';

export interface LanguageConfig {
  code: string;
  name: string;
  region: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  // Americas
  { code: 'en', name: 'English', region: 'Americas', direction: 'ltr' },
  { code: 'es', name: 'Spanish', region: 'Americas', direction: 'ltr' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', region: 'Americas', direction: 'ltr' },
  
  // Asia
  { code: 'th', name: 'Thai', region: 'Asia', direction: 'ltr' },
  { code: 'ko', name: 'Korean', region: 'Asia', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', region: 'Asia', direction: 'ltr' },
  { code: 'tl', name: 'Filipino', region: 'Asia', direction: 'ltr' },
  { code: 'zh-cn', name: 'Chinese (Simplified)', region: 'Asia', direction: 'ltr' },
  
  // European Union
  { code: 'fr', name: 'French', region: 'Europe', direction: 'ltr' },
  { code: 'de', name: 'German', region: 'Europe', direction: 'ltr' },
  { code: 'it', name: 'Italian', region: 'Europe', direction: 'ltr' },
  
  // Middle East and North Africa
  { code: 'ar', name: 'Arabic', region: 'MENA', direction: 'rtl' },
  { code: 'he', name: 'Hebrew', region: 'MENA', direction: 'rtl' },
  { code: 'tr', name: 'Turkish', region: 'MENA', direction: 'ltr' },
  { code: 'fa', name: 'Persian', region: 'MENA', direction: 'rtl' },
  
  // SADC Region
  { code: 'sw', name: 'Swahili', region: 'Africa', direction: 'ltr' },
];

export const DEFAULT_LANGUAGE = 'en';
export const FALLBACK_LANGUAGE = 'en';

export const DOCS_ROOT = join(process.cwd(), 'docs');
export const TRANSLATIONS_ROOT = join(process.cwd(), 'src/localization/translations');

export interface TranslationApiConfig {
  provider: 'azure' | 'openai' | 'deepl';
  apiKey: string;
  endpoint?: string;
  region?: string;
}

export const TRANSLATION_API: TranslationApiConfig = {
  provider: process.env.TRANSLATION_PROVIDER as 'azure' | 'openai' | 'deepl' || 'azure',
  apiKey: process.env.TRANSLATION_API_KEY || '',
  endpoint: process.env.TRANSLATION_ENDPOINT,
  region: process.env.TRANSLATION_REGION
};

export const QUALITY_CHECKS = {
  validateLinks: true,
  validateMarkdown: true,
  validateCompleteness: true,
  validateCompliance: true
};
