import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE,
  DOCS_ROOT,
  TRANSLATIONS_ROOT,
  TRANSLATION_API,
  LanguageConfig
} from '../config/localization';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';

export class LocalizationService {
  private static instance: LocalizationService;
  private metrics: MetricsService;
  private translationCache: Map<string, any> = new Map();
  
  private constructor() {
    this.metrics = MetricsService.getInstance();
  }

  public static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  /**
   * Get supported languages grouped by region
   */
  public getLanguagesByRegion(): Record<string, LanguageConfig[]> {
    return SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      if (!acc[lang.region]) {
        acc[lang.region] = [];
      }
      acc[lang.region].push(lang);
      return acc;
    }, {} as Record<string, LanguageConfig[]>);
  }

  /**
   * Translate a Markdown file to all supported languages
   */
  public async translateMarkdownFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf8');
      const relativePath = filePath.replace(join(DOCS_ROOT, DEFAULT_LANGUAGE), '');
      
      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang.code === DEFAULT_LANGUAGE) continue;
        
        const targetPath = join(DOCS_ROOT, lang.code, relativePath);
        await this.translateAndSaveMarkdown(content, targetPath, lang.code);
        
        this.metrics.incrementCounter('markdown_translations');
      }
    } catch (error) {
      logger.error('Error translating Markdown file', { 
        file: filePath, 
        error: (error as Error).message 
      });
      this.metrics.incrementCounter('translation_errors');
    }
  }

  /**
   * Validate translated content
   */
  private async validateTranslation(original: string, translated: string, targetLang: string): Promise<boolean> {
    // Basic validation
    if (!translated || translated === original) {
      return false;
    }

    // Check for common translation artifacts
    const artifacts = ['[object Object]', 'undefined', 'null'];
    if (artifacts.some(artifact => translated.includes(artifact))) {
      return false;
    }

    // Check markdown structure is preserved
    const originalLinks = original.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const translatedLinks = translated.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    if (originalLinks.length !== translatedLinks.length) {
      return false;
    }

    return true;
  }

  /**
   * Translate and save Markdown content
   */
  private async translateAndSaveMarkdown(content: string, targetPath: string, targetLang: string): Promise<void> {
    try {
      // Split content to preserve markdown structure
      const segments = this.splitMarkdownContent(content);
      const translatedSegments = await Promise.all(
        segments.map(segment => this.translateSegment(segment, targetLang))
      );
      
      const translatedContent = translatedSegments.join('\n');
      
      // Validate translation
      if (await this.validateTranslation(content, translatedContent, targetLang)) {
        await writeFile(targetPath, translatedContent, 'utf8');
        logger.info('Successfully translated and saved file', { targetPath, targetLang });
      } else {
        throw new Error('Translation validation failed');
      }
    } catch (error) {
      logger.error('Error in translation process', { 
        targetPath, 
        targetLang, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Split markdown content into translatable segments
   */
  private splitMarkdownContent(content: string): string[] {
    // Split by headers and paragraphs while preserving structure
    return content
      .split(/(?=#{1,6}\s|[^\S\r\n]*\n\s*\n)/)
      .filter(segment => segment.trim().length > 0);
  }

  /**
   * Translate a single segment using configured translation API
   */
  private async translateSegment(segment: string, targetLang: string): Promise<string> {
    const cacheKey = `${segment}:${targetLang}`;
    
    // Check cache first
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }
    
    try {
      let translatedText: string;
      
      switch (TRANSLATION_API.provider) {
        case 'azure':
          translatedText = await this.translateWithAzure(segment, targetLang);
          break;
        case 'openai':
          translatedText = await this.translateWithOpenAI(segment, targetLang);
          break;
        case 'deepl':
          translatedText = await this.translateWithDeepL(segment, targetLang);
          break;
        default:
          throw new Error(`Unsupported translation provider: ${TRANSLATION_API.provider}`);
      }
      
      // Cache the result
      this.translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      logger.error('Translation error', { 
        provider: TRANSLATION_API.provider,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Translate using Azure Translator API
   */
  private async translateWithAzure(text: string, targetLang: string): Promise<string> {
    // Implementation for Azure Translator API
    return text; // Placeholder
  }

  /**
   * Translate using OpenAI API
   */
  private async translateWithOpenAI(text: string, targetLang: string): Promise<string> {
    // Implementation for OpenAI API
    return text; // Placeholder
  }

  /**
   * Translate using DeepL API
   */
  private async translateWithDeepL(text: string, targetLang: string): Promise<string> {
    // Implementation for DeepL API
    return text; // Placeholder
  }

  /**
   * Get translation status for all documents
   */
  public async getTranslationStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};
    
    try {
      const defaultDocs = await readdir(join(DOCS_ROOT, DEFAULT_LANGUAGE));
      
      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang.code === DEFAULT_LANGUAGE) continue;
        
        const langPath = join(DOCS_ROOT, lang.code);
        const translatedDocs = await readdir(langPath);
        
        status[lang.code] = {
          total: defaultDocs.length,
          translated: translatedDocs.length,
          percentage: (translatedDocs.length / defaultDocs.length) * 100
        };
      }
    } catch (error) {
      logger.error('Error getting translation status', { 
        error: (error as Error).message 
      });
    }
    
    return status;
  }
}
