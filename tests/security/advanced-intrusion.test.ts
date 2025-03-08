import { SecurityAnalyzer } from '@/services/security/analyzer.service';
import { IntrusionSimulator } from '@/test/utils/intrusion-simulator';

describe('Advanced Intrusion Detection', () => {
  let securityAnalyzer: SecurityAnalyzer;
  let intrusionSimulator: IntrusionSimulator;

  beforeEach(() => {
    securityAnalyzer = new SecurityAnalyzer();
    intrusionSimulator = new IntrusionSimulator();
  });

  test('should detect sophisticated multi-stage attacks', async () => {
    const attackChain = await intrusionSimulator.createAdvancedChain([
      { phase: 'RECONNAISSANCE', technique: 'API_FINGERPRINTING' },
      { phase: 'WEAPONIZATION', technique: 'PAYLOAD_POLYMORPHISM' },
      { phase: 'DELIVERY', technique: 'PROTOCOL_MANIPULATION' },
      { phase: 'EXPLOITATION', technique: 'RACE_CONDITION' }
    ]);

    const detection = await securityAnalyzer.analyzeAttackChain(attackChain);
    expect(detection.detectedPhases).toHaveLength(attackChain.length);
    expect(detection.mitigationStrategy).toBeDefined();
  });

  test('should prevent advanced data exfiltration attempts', async () => {
    const exfilAttempt = await intrusionSimulator.simulateExfiltration({
      technique: 'COVERT_CHANNEL',
      encoding: 'STEGANOGRAPHY',
      protocol: 'DNS_TUNNELING'
    });

    const prevention = await securityAnalyzer.detectExfiltration(exfilAttempt);
    expect(prevention.blocked).toBe(true);
    expect(prevention.detectionMethod).toBe('BEHAVIORAL_ANALYSIS');
  });
});
