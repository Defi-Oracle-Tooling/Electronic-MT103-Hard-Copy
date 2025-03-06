import type { AuditEvent, AuditEventType } from '@/types/audit';

export class AuditService {
  private static instance: AuditService;
  private baseUrl: string = '/api/audit';

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logEvent(
    type: AuditEventType,
    details: Record<string, any>,
    severity: AuditEvent['severity'] = 'LOW'
  ): Promise<void> {
    await fetch(`${this.baseUrl}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        details,
        severity,
        timestamp: new Date(),
      }),
    });
  }

  async getAuditTrail(filters?: Partial<AuditEvent>): Promise<AuditEvent[]> {
    const queryParams = new URLSearchParams(filters as Record<string, string>);
    const response = await fetch(`${this.baseUrl}/trail?${queryParams}`);
    return response.json();
  }
}
