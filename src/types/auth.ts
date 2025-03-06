export type UserRole = 'USER' | 'EMPLOYEE' | 'ADMIN';

export interface UserPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationType: 'COMMERCIAL_BANK' | 'CENTRAL_BANK' | 'TREASURY' | 'MINISTRY';
  permissions: UserPermission[];
  mfaEnabled: boolean;
  lastLogin: Date;
}

export type PortalType = 'USER' | 'EMPLOYEE' | 'ADMIN';

export interface AuthResponse {
  user: User;
  token: string;
  mfaRequired: boolean;
}

export interface MFARequest {
  email: string;
  code: string;
  token: string;
}

export interface PortalAccess {
  portalType: PortalType;
  features: string[];
  dashboards: string[];
}
