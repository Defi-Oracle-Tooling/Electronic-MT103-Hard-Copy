import { Request, Response, NextFunction } from 'express';
import { TracerService } from '../services/tracer.service';
import { SpanKind } from '@opentelemetry/api';

export class TraceMiddleware {
  private tracer: TracerService;

  constructor() {
    this.tracer = TracerService.getInstance();
  }

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.tracer.trace(
      `HTTP ${req.method} ${req.path}`,
      async (span) => {
        span.setAttribute('http.method', req.method);
        span.setAttribute('http.url', req.path);
        span.setAttribute('http.route', req.route?.path || req.path);
        span.setAttribute('http.user_agent', req.get('user-agent') || '');

        res.on('finish', () => {
          span.setAttribute('http.status_code', res.statusCode);
        });

        return next();
      },
      SpanKind.SERVER,
      {
        'request.id': req.headers['x-request-id']?.toString() || '',
        'request.ip': req.ip
      }
    );
  };
}
