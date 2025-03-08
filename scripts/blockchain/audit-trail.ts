import { ethers } from 'ethers';
import { AuditContract } from '@/contracts/AuditContract';
import { ConfigService } from '@/services/config.service';

export class BlockchainAuditTrail {
  private readonly provider: ethers.Provider;
  private readonly contract: AuditContract;

  constructor() {
    const config = new ConfigService();
    this.provider = new ethers.JsonRpcProvider(config.get('ETHEREUM_RPC_URL'));
    this.contract = new AuditContract(
      config.get('AUDIT_CONTRACT_ADDRESS'),
      this.provider
    );
  }

  async recordAuditEvent(event: AuditEvent): Promise<string> {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(event)));
    const tx = await this.contract.recordAudit(hash, {
      timestamp: event.timestamp,
      eventType: event.type,
      userHash: event.userHash,
      dataHash: event.dataHash
    });
    
    await tx.wait();
    return tx.hash;
  }

  async verifyAuditTrail(eventHash: string): Promise<boolean> {
    return this.contract.verifyAudit(eventHash);
  }
}
