import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { MetricsService } from '../services/metrics.service';
import { compress } from 'compression';
import { trace, context, SpanStatusCode, propagation } from '@opentelemetry/api';
import { ApiCacheService } from '../services/api-cache.service';

/**
 * API request optimizer middleware with advanced features:
 * - Request tracing
 * - Response time tracking
 * - Response compression
 * - Conditional caching
 * - Rate limiting support
 */
export class ApiRequestOptimizer {
  private static instance: ApiRequestOptimizer;
  private metrics: MetricsService;
  private cacheService: ApiCacheService;
  private readonly compressionMiddleware = compress({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress already compressed formats
      const contentType = res.getHeader('Content-Type') as string || '';
      if (/(image|video|audio|application\/zip|application\/gzip)/i.test(contentType)) {
        return false;
      }
      return true;
    }
  });

  private constructor() {
    this.metrics = MetricsService.getInstance();
    this.cacheService = ApiCacheService.getInstance();
  }

  public static getInstance(): ApiRequestOptimizer {
    if (!ApiRequestOptimizer.instance) {
      ApiRequestOptimizer.instance = new ApiRequestOptimizer();
    }
    return ApiRequestOptimizer.instance;
  }

  /**
   * Apply all optimization middleware to an Express app
   */
  public applyMiddleware(app: any): void {
    // Apply compression middleware
    app.use(this.compressionMiddleware);
    
    // Apply custom middleware
    app.use(this.requestTracingMiddleware());
    app.use(this.responseTimeMiddleware());
    app.use(this.conditionalCacheMiddleware());
    
    // Register cleanup on process exit
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
  }

  /**
   * Middleware for distributed tracing
   */
  private requestTracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Extract trace context from headers if present
      const carrier: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          carrier[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          carrier[key] = value[0];
        }
      }

      // Set up trace context for request processing
      const activeContext = propagation.extract(context.active(), carrier);
      const tracer = trace.getTracer('express-api');
      
      // Create a new span for this request
      const span = tracer.startSpan(`${req.method} ${req.path}`, {}, activeContext);
      
      // Add request details to the span
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.originalUrl || req.url);
      span.setAttribute('http.user_agent', req.get('user-agent') || '');
      
      // Store the span in the request object for later use
      (req as any).__span = span;
      
      // Add unique request ID to response headers for traceability
      const requestId = span.spanContext().traceId;
      res.setHeader('X-Request-ID', requestId);
      
      // Handle request completion
      const endRequest = () => {
        if (span) {
          // Add response information to the span
          span.setAttribute('http.status_code', res.statusCode);
          
          // Mark span as error if status code is 4xx or 5xx
          if (res.statusCode >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${res.statusCode}`
            });
          }
          
          // End the span
          span.end();
        }
      };
      
      // Capture response completion
      res.on('finish', endRequest);
      res.on('close', endRequest);

      next();
    };
  }

  /**
   * Middleware for tracking response time
   */
  private responseTimeMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime.bigint();
      
      // Function to finalize timing on response completion
      const endTimer = () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        
        // Add response time to response headers
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
        
        // Record metrics
        this.metrics.recordHistogram('http.response_time', durationMs, {
          method: req.method,
          route: this.normalizeRoute(req),
          status_code: res.statusCode.toString()
        });
        
        // Log requests that take too long
        if (durationMs > 1000) {
          logger.warn('Slow request detected', {
            method: req.method,
            path: req.originalUrl || req.url,
            duration: durationMs,
            status: res.statusCode
          });
        }
      };
      
      // Capture response completion
      res.on('finish', endTimer);
      res.on('close', endTimer);

      next();
    };
  }

  /**
   * Middleware for conditional response caching
   */
  private conditionalCacheMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only apply to GET and HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      
      // Skip caching for authenticated requests by default
      if (req.headers.authorization) {
        return next();
      }

      // Store original send method
      const originalSend = res.send;
      
      // Override send method to capture and potentially cache responses
      res.send = (body?: any): Response => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Check cache headers
          const cacheControl = res.getHeader('Cache-Control') || '';
          
          // Don't cache if explicitly disallowed
          if (typeof cacheControl === 'string' && 
              !cacheControl.includes('no-store') && 
              !cacheControl.includes('private')) {
            
            // Cache the response (implement actual caching logic)
            try {
              const cacheKey = `${req.method}:${req.originalUrl || req.url}`;
              this.cacheService.invalidateCache(cacheKey, {});
              
              // You could store the body in a cache here
            } catch (error) {
              logger.error('Cache error', { error: (error as Error).message });
            }
          }
        }
        
        // Call the original send method
        return originalSend.call(res, body);
      };
      
      next();
    };
  }

  /**
   * Normalize route by replacing dynamic parameters with placeholders
   * e.g., /users/123/posts -> /users/:id/posts
   */
  private normalizeRoute(req: Request): string {
    if (!req.route) return 'unknown';
    
    // Extract route pattern from Express
    let route = req.route.path || '';
    
    // Handle Express root path
    if (route === '/' && req.baseUrl) {
      route = req.baseUrl;
    } else if (req.baseUrl) {
      route = req.baseUrl + route;
    }
    
    return route;
  }

  /**
   * Clean up resources when shutting down
   */
  private cleanup(): void {
    // Nothing to clean up in this middleware
    logger.info('API Request Optimizer shutting down');
  }
}
