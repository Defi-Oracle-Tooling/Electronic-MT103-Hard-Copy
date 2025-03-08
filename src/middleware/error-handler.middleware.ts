import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { MetricsService } from '../services/metrics.service';

export class ErrorHandlerMiddleware {
  private metricsService: MetricsService;

  constructor() {
    this.metricsService = MetricsService.getInstance();
  }

  handle = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.error({
      id: errorId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    }, 'Request error');

    this.metricsService.incrementCounter('errors_total', {
      path: req.path,
      method: req.method,
      type: err.name
    });

    // Don't expose internal errors to client
    res.status(500).json({
      error: 'Internal server error',
      errorId,
      code: err.name === 'ValidationError' ? 400 : 500
    });
  };
}
