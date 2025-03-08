import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { randomBytes } from 'crypto';
import { MetricsService } from '../services/metrics.service';
import { logger } from '../utils/logger';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * Comprehensive security middleware for Express applications
 */
export class SecurityEnhancer {
  private static instance: SecurityEnhancer;
  private metricsService: MetricsService;
  private errorHandler: ErrorHandlerService;
  
  private constructor() {
    this.metricsService = MetricsService.getInstance();
    this.errorHandler = ErrorHandlerService.getInstance();
  }

  public static getInstance(): SecurityEnhancer {
    if (!SecurityEnhancer.instance) {
      SecurityEnhancer.instance = new SecurityEnhancer();
    }
    return SecurityEnhancer.instance;
  }

  configure() {
    return {
      helmet: this.configureHelmet(),
      rateLimit: this.configureRateLimit(),
      slowDown: this.configureSlowDown(),
      corsHandler: this.corsHandler.bind(this)
    };
  }

  /**
   * Apply all security middleware to an Express app
   */
  public applyMiddleware(app: any): void {
    // Apply helmet for security headers
    app.use(this.configureHelmet());
    
    // Apply custom nonce middleware for CSP
    app.use(this.nonceMiddleware());
    
    // Apply rate limiting and brute force protection
    app.use('/api/', this.configureRateLimiting());
    app.use('/api/', this.configureSpeedLimiting());
    
    // Apply CORS protection
    app.use(this.corsMiddleware());
    
    // Apply request validation
    app.use(this.requestValidationMiddleware());
    
    // Apply content type protection
    app.use(this.contentTypeMiddleware());
    
    logger.info('Security middleware applied');
  }

  /**
   * Configure helmet with enhanced security headers
   */
  private configureHelmet() {
    return helmet({
      // Configure Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'strict-dynamic'", (req: Request, res: Response) => `'nonce-${(res.locals.nonce || '')}'`],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://*.azure-api.net'],
          connectSrc: ["'self'", 'https://*.azure-api.net', 'https://*.applicationinsights.azure.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // Strict transport security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      // Prevent iframe embedding
      frameguard: {
        action: 'deny'
      },
      // Disable X-Powered-By header
      hidePoweredBy: true,
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS protection
      xssFilter: true,
      // Referrer policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      // Set permissions policy
      permissionsPolicy: {
        features: {
          geolocation: ["'none'"],
          camera: ["'none'"],
          microphone: ["'none'"],
          payment: ["'self'"],
          fullscreen: ["'self'"]
        }
      }
    });
  }

  /**
   * Generate cryptographic nonce for Content Security Policy
   */
  private nonceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Generate random nonce for each request
      res.locals.nonce = randomBytes(16).toString('base64');
      next();
    };
  }

  /**
   * Configure rate limiting to prevent abuse
   */
  private configureRateLimiting() {
    const rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/ping';
      },
      handler: (req: Request, res: Response) => {
        this.metricsService.incrementCounter('security.rate_limit_exceeded');
        
        // Log rate limiting
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path
        });
        
        res.status(429).json({
          error: 'Too many requests, please try again later.'
        });
      }
    });
    
    return rateLimiter;
  }

  /**
   * Configure speed limiting for progressive slowing down of responses
   */
  private configureSpeedLimiting() {
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 30, // Allow 30 requests per windowMs without slowing down
      delayMs: (hits) => hits * 100, // Add 100ms delay per hit above threshold
      skip: (req: Request) => {
        // Skip speed limiting for health checks
        return req.path === '/health' || req.path === '/ping';
      },
      onLimitReached: (req: Request, res: Response, options) => {
        this.metricsService.incrementCounter('security.speed_limit_reached');
        
        // Log speed limiting
        logger.info('Speed limit reached', {
          ip: req.ip,
          path: req.path
        });
      }
    });
    
    return speedLimiter;
  }

  /**
   * CORS middleware with secure configuration
   */
  private corsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Get allowed origins from environment or configuration
      const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['https://mt103.example.com'];
      
      const origin = req.headers.origin;
      
      // Check if the request origin is allowed
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Default origin if not in allowed list
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
      
      // Set other CORS headers
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      
      next();
    };
  }

  /**
   * Validate request data for security issues
   */
  private requestValidationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Very basic validation - in a real app, use a proper validator like Joi or express-validator
        if (req.body && typeof req.body === 'object') {
          // Check for suspicious patterns
          const stringifiedBody = JSON.stringify(req.body);
          
          // Check for potential script injection
          if (/<script|javascript:|data:text\/html|base64/i.test(stringifiedBody)) {
            this.metricsService.incrementCounter('security.script_injection_attempt');
            
            logger.warn('Potential script injection detected', {
              ip: req.ip,
              path: req.path
            });
            
            return res.status(400).json({ error: 'Invalid request payload' });
          }
          
          // Check for suspiciously large payloads
          if (stringifiedBody.length > 1000000) { // 1MB
            this.metricsService.incrementCounter('security.large_payload');
            
            logger.warn('Suspiciously large payload detected', {
              ip: req.ip,
              path: req.path,
              size: stringifiedBody.length
            });
            
            return res.status(413).json({ error: 'Request payload too large' });
          }
        }
        
        next();
      } catch (error) {
        this.errorHandler.handleError(error as Error, {
          component: 'SecurityEnhancer',
          operation: 'requestValidation',
          request: {
            path: req.path,
            method: req.method,
            ip: req.ip
          }
        });
        
        res.status(400).json({ error: 'Invalid request' });
      }
    };
  }

  /**
   * Content type validation middleware
   */
  private contentTypeMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip for GET, OPTIONS, HEAD requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }
      
      const contentType = req.headers['content-type'] || '';
      
      // For requests with content, enforce JSON content type for API endpoints
      if (req.path.startsWith('/api/') && req.body && Object.keys(req.body).length > 0) {
        if (!contentType.includes('application/json')) {
          this.metricsService.incrementCounter('security.invalid_content_type');
          
          logger.warn('Invalid content type', {
            ip: req.ip,
            path: req.path,
            contentType
          });
          
          return res.status(415).json({ error: 'Unsupported media type. API expects application/json' });
        }
      }
      
      next();
    };
  }
}
