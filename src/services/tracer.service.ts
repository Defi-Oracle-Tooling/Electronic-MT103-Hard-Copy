import { trace, context, SpanKind, Span, Tracer } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { logger } from '../utils/logger';

export class TracerService {
  private static instance: TracerService;
  private tracer: Tracer;

  private constructor() {
    this.tracer = this.initializeTracer();
  }

  static getInstance(): TracerService {
    if (!TracerService.instance) {
      TracerService.instance = new TracerService();
    }
    return TracerService.instance;
  }

  async trace<T>(
    name: string,
    operation: (span: Span) => Promise<T>,
    kind: SpanKind = SpanKind.INTERNAL,
    attributes: Record<string, string> = {}
  ): Promise<T> {
    const span = this.tracer.startSpan(name, { kind });
    
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }

    try {
      const result = await context.with(trace.setSpan(context.active(), span), 
        () => operation(span));
      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2 }); // Error
      span.end();
      throw error;
    }
  }

  private initializeTracer(): Tracer {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'mt103-service',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
      })
    });

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: {
        'Authorization': `Bearer ${process.env.OTEL_EXPORTER_OTLP_HEADERS}`
      }
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();

    return trace.getTracer('mt103-service');
  }
}
