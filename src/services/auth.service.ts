import type { AuthResponse, MFARequest, User } from '@/types/auth';

export class AuthService {
  private static instance: AuthService;
  private baseUrl: string = '/api/auth';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return response.json();
  }

  async verifyMFA(request: MFARequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('MFA verification failed');
    }

    return response.json();
  }

  async validateSession(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/session`);
    if (!response.ok) {
      throw new Error('Invalid session');
    }
    return response.json();
  }
}
