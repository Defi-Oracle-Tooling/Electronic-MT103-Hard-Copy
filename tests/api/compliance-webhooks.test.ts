import { createServer } from 'http';
import { ComplianceWebhookService } from '@/services/compliance/webhook.service';
import crypto from 'crypto';

describe('Compliance Webhooks', () => {
  let webhookService: ComplianceWebhookService;
  let mockServer: any;
  const webhookSecret = 'test-secret-key';

  beforeEach(() => {
    webhookService = new ComplianceWebhookService();
  });

  beforeAll((done) => {
    mockServer = createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const signature = req.headers['x-compliance-signature'];
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(body)
          .digest('hex');

        if (signature === expectedSignature) {
          res.writeHead(200);
          res.end('OK');
        } else {
          res.writeHead(401);
          res.end('Invalid signature');
        }
      });
    }).listen(3001, done);
  });

  afterAll((done) => {
    mockServer.close(done);
  });

  test('should deliver compliance events with valid signatures', async () => {
    const event = {
      type: 'COMPLIANCE_VIOLATION',
      severity: 'HIGH',
      details: { rule: 'PSD2_SCA', violation: 'Missing authentication' }
    };

    const result = await webhookService.dispatchEvent(
      'http://localhost:3001/webhook',
      event,
      webhookSecret
    );

    expect(result.status).toBe(200);
    expect(result.delivered).toBe(true);
  });

  test('should handle webhook delivery failures', async () => {
    const result = await webhookService.dispatchEvent(
      'http://localhost:3001/non-existent',
      { type: 'TEST' },
      webhookSecret
    );

    expect(result.delivered).toBe(false);
    expect(result.retryCount).toBe(3);
    expect(result.error).toBeDefined();
  });

  test('should retry failed deliveries with exponential backoff', async () => {
    let attempts = 0;
    mockServer.on('request', (req, res) => {
      attempts++;
      if (attempts < 3) {
        res.writeHead(503);
        res.end('Service Unavailable');
      }
    });

    const result = await webhookService.dispatchEvent(
      'http://localhost:3001/webhook',
      { type: 'RETRY_TEST' },
      webhookSecret
    );

    expect(attempts).toBe(3);
    expect(result.retryDelays).toEqual([1000, 2000, 4000]); // Exponential backoff
  });

  test('should batch multiple compliance events', async () => {
    const events = Array(5).fill(null).map((_, i) => ({
      type: 'BATCH_TEST',
      id: `event-${i}`,
      timestamp: new Date()
    }));

    const result = await webhookService.dispatchBatch(
      'http://localhost:3001/webhook',
      events,
      webhookSecret
    );

    expect(result.batchSize).toBe(5);
    expect(result.successCount).toBe(5);
  });
});
