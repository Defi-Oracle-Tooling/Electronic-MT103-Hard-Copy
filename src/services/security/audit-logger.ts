import { createHash } from 'crypto';
import { BlockchainService } from './blockchain.service';

export class SecurityAuditLogger {
  private readonly blockchain: BlockchainService;
  private readonly eventBuffer: SecurityEvent[] = [];
  
  constructor() {
    this.blockchain = new BlockchainService();
    this.setupPeriodicCommit();
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const enrichedEvent = this.enrichEvent(event);
    this.eventBuffer.push(enrichedEvent);
    
    // Immediate commit for high-priority events
    if (event.priority === 'HIGH') {
      await this.commitToBlockchain([enrichedEvent]);
    }
  }

  private enrichEvent(event: SecurityEvent): EnrichedSecurityEvent {
    const timestamp = new Date().toISOString();
    const hash = this.calculateEventHash(event, timestamp);

    return {
      ...event,
      timestamp,
      hash,
      metadata: {
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
        region: process.env.AWS_REGION
      }
    };
  }

  private calculateEventHash(event: SecurityEvent, timestamp: string): string {
    return createHash('sha256')
      .update(`${JSON.stringify(event)}_${timestamp}`)
      .digest('hex');
  }
}
