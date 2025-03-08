import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Error types to properly categorize different errors
export enum ErrorCategory {
  VALIDATION = 'validation',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  INTEGRATION = 'integration',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export interface StructuredError {
  message: string;
  code: string;
  category: ErrorCategory;
  statusCode: number;
  correlationId?: string;
  details?: Record<string, any>;
  originalError?: Error;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private metricsService: MetricsService;
  private errorHistoryLimit = 100;
  private recentErrors: Array<{ timestamp: number; error: StructuredError }> = [];
  
  private constructor() {
    this.metricsService = MetricsService.getInstance();
  }

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }
  
  /**
   * Handle errors in a standardized way across the application
   */
  public handleError(error: Error | StructuredError, context?: Record<string, any>): StructuredError {
    const structuredError = this.normalizeError(error);
    
    // Add the error to recent history for pattern detection
    this.trackError(structuredError);
    
    // Log the error with appropriate level based on severity
    this.logError(structuredError, context);
    
    // Record error metrics
    this.recordErrorMetrics(structuredError);
    
    // Update OpenTelemetry span if available
    this.updateTraceWithError(structuredError);
    
    return structuredError;
  }

  /**
   * Convert any error to a structured error format
   */
  private normalizeError(error: Error | StructuredError): StructuredError {
    if ('category' in error && 'statusCode' in error) {
      return error as StructuredError;
    }
    
    // Try to determine error category and status code from error instance or message
    const originalError = error as Error;
    let category = ErrorCategory.UNKNOWN;
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    
    // Detect common error patterns
    if (originalError.name === 'ValidationError' || originalError.message.includes('validation')) {
      category = ErrorCategory.VALIDATION;
      statusCode = 400;
      code = 'VALIDATION_ERROR';
    } else if (originalError.name === 'UnauthorizedError' || originalError.message.includes('unauthorized')) {
      category = ErrorCategory.AUTHENTICATION;
      statusCode = 401;
      code = 'UNAUTHORIZED';
    } else if (originalError.message.includes('permission') || originalError.message.includes('forbidden')) {
      category = ErrorCategory.AUTHORIZATION;
      statusCode = 403;
      code = 'FORBIDDEN';
    } else if (originalError.name === 'NotFoundError' || originalError.message.includes('not found')) {
      statusCode = 404;
      code = 'NOT_FOUND';
    } else if (originalError.message.includes('timeout') || originalError.message.includes('timed out')) {
      category = ErrorCategory.NETWORK;
      statusCode = 504;
      code = 'TIMEOUT';
    } else if (originalError.message.includes('database') || originalError.message.includes('query')) {
      category = ErrorCategory.DATABASE;
      code = 'DATABASE_ERROR';
    }
    
    return {
      message: originalError.message,
      code,
      category,
      statusCode,
      originalError,
      details: {},
      correlationId: this.getCorrelationId()
    };
  }

  /**
   * Log the error with appropriate severity level
   */
  private logError(error: StructuredError, context?: Record<string, any>): void {
    const logData = {
      errorCode: error.code,
      errorCategory: error.category,
      statusCode: error.statusCode,
      correlationId: error.correlationId,
      details: error.details,
      context,
      stack: error.originalError?.stack
    };
    
    // Log with appropriate level based on status code
    if (error.statusCode >= 500) {
      logger.error(error.message, logData);
    } else if (error.statusCode >= 400) {
      logger.warn(error.message, logData);
    } else {
      logger.info(error.message, logData);
    }
  }
  
  /**
   * Track error for pattern detection
   */
  private trackError(error: StructuredError): void {
    this.recentErrors.push({
      timestamp: Date.now(),
      error
    });
    
    // Keep error history within limit
    if (this.recentErrors.length > this.errorHistoryLimit) {
      this.recentErrors.shift();
    }
    
    // Check for error patterns (high frequency of same error)
    this.detectErrorPatterns(error);
  }
  
  /**
   * Update OpenTelemetry trace with error information
   */
  private updateTraceWithError(error: StructuredError): void {
    const currentSpan = trace.getSpan(context.active());
    if (currentSpan) {
      currentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      
      currentSpan.setAttribute('error', true);
      currentSpan.setAttribute('error.type', error.category);
      currentSpan.setAttribute('error.code', error.code);
      currentSpan.setAttribute('error.status_code', error.statusCode);
      
      if (error.correlationId) {
        currentSpan.setAttribute('error.correlation_id', error.correlationId);
      }
      
      currentSpan.recordException(error.originalError || new Error(error.message));
    }
  }
  
  /**
   * Record metrics about errors
   */
  private recordErrorMetrics(error: StructuredError): void {
    this.metricsService.incrementCounter('errors_total');
    this.metricsService.incrementCounter(`errors_by_category.${error.category}`);
    this.metricsService.incrementCounter(`errors_by_code.${error.code}`);
    this.metricsService.incrementCounter(`errors_by_status.${error.statusCode}`);
  }
  
  /**
   * Detect patterns in errors (e.g., sudden increase in same error type)
   */
  private detectErrorPatterns(error: StructuredError): void {
    const last5Minutes = Date.now() - 5 * 60 * 1000;
    
    // Count recent occurrences of this error code
    const recentOccurrences = this.recentErrors.filter(item => 
      item.timestamp > last5Minutes && 
      item.error.code === error.code
    );
    
    // Alert if error frequency is high
    if (recentOccurrences.length >= 5) {
      logger.warn(`High frequency of error code ${error.code} detected: ${recentOccurrences.length} occurrences in last 5 minutes`, {
        errorCode: error.code,
        occurrences: recentOccurrences.length,
        category: error.category
      });
      
      // Could trigger alerts or auto-remediation here
    }
  }
  
  /**
   * Get correlation ID from trace context or generate a new one
   */
  private getCorrelationId(): string {
    // Try to get trace ID from OpenTelemetry context
    const currentSpan = trace.getSpan(context.active());
    if (currentSpan) {
      const spanContext = currentSpan.spanContext();
      return spanContext.traceId;
    }
    
    // Generate random ID if no trace context available
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Get recent errors for monitoring dashboards
   */
  public getRecentErrors(): Array<{ timestamp: number; error: StructuredError }> {
    return [...this.recentErrors];
  }
  
  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, any> {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentErrors = this.recentErrors.filter(item => item.timestamp > last24Hours);
    
    // Group by category
    const categoryCounts = recentErrors.reduce((acc, item) => {
      const category = item.error.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by code
    const codeCounts = recentErrors.reduce((acc, item) => {
      const code = item.error.code;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: recentErrors.length,
      byCategory: categoryCounts,
      byCode: codeCounts,
      timestamp: new Date().toISOString()
    };
  }
}
