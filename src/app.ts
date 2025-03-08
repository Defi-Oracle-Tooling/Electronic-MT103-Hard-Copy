import express from 'express';
import { SecurityEnhancer } from './middleware/security-enhancer';
import { PerformanceMonitorMiddleware } from './middleware/performance-monitor.middleware';
import { MonitoringMiddleware } from './middleware/monitoring.middleware';
import { logger } from './utils/logger';

const app = express();

// Initialize middleware
const securityEnhancer = SecurityEnhancer.getInstance();
const performanceMonitor = new PerformanceMonitorMiddleware();
const monitoring = new MonitoringMiddleware();

// Initialize services
const healthMonitor = HealthMonitorService.getInstance();
const circuitBreaker = CircuitBreaker.getInstance();
const traceMiddleware = new TraceMiddleware();

// Apply middleware
securityEnhancer.applyMiddleware(app);
app.use(traceMiddleware.handle);
app.use(performanceMonitor.handle);
app.use(monitoring.handle);

// Add health check endpoint
app.get('/health', async (req, res) => {
  const health = await healthMonitor.checkHealth();
  const status = health.every(check => check.status === 'healthy') ? 200 : 503;
  res.status(status).json({ checks: health });
});

// Wrap routes with circuit breaker
app.use('/api', async (req, res, next) => {
  try {
    await circuitBreaker.execute(
      'api-endpoint',
      () => next(),
      () => res.status(503).json({ error: 'Service temporarily unavailable' })
    );
  } catch (error) {
    next(error);
  }
});

// Error handling with monitoring
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const monitoringService = monitoring.getMetricsService();
  monitoringService.incrementCounter('error_count', {
    type: error.name,
    path: req.path
  });

  logger.error({
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.locals?.requestId
  });
});

export default app;
