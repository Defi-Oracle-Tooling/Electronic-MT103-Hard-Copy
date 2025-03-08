import { StrongAuthService } from '../security/strong-auth.service';
import { ConsentManager } from './consent-manager';
import { APIGatewayService } from '../api/gateway.service';

export class PSD2ComplianceService {
  private readonly strongAuth: StrongAuthService;
  private readonly consent: ConsentManager;
  private readonly gateway: APIGatewayService;

  constructor() {
    this.strongAuth = new StrongAuthService();
    this.consent = new ConsentManager();
    this.gateway = new APIGatewayService();
  }

  async validateSCA(transaction: MT103Transaction): Promise<boolean> {
    const riskLevel = await this.assessTransactionRisk(transaction);
    if (riskLevel === 'HIGH') {
      return this.strongAuth.performStrongAuthentication(transaction);
    }
    return true;
  }

  async validateConsent(accountId: string, accessType: string): Promise<boolean> {
    const consent = await this.consent.getConsent(accountId);
    return this.validateConsentScope(consent, accessType);
  }

  async setupAPIAccess(tppId: string): Promise<APIAccess> {
    const certificate = await this.validateEIDASCertificate(tppId);
    return this.gateway.provisionAccess(tppId, certificate);
  }
}
