export type ID = string;

export type Theme = 'light' | 'dark' | 'system';

export type BuildingStatus = 'active' | 'maintenance' | 'inactive';
export type LabStatus = 'active' | 'maintenance' | 'inactive';
export type ComputerStatus = 'active' | 'maintenance' | 'offline';
export type ShieldStatus = 'protected' | 'partially' | 'unprotected';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface User {
  id: ID;
  name: string;
  email: string;
  password: string;
  role: string;
  avatarColor: string;
}

export interface Building {
  id: ID;
  name: string;
  code: string;
  location: string;
  description: string;
  status: BuildingStatus;
  createdAt: string;
}

export interface Lab {
  id: ID;
  name: string;
  code: string;
  buildingId: ID;
  capacity: number;
  status: LabStatus;
  createdAt: string;
}

export interface Computer {
  id: ID;
  name: string;
  assetId: string;
  labId: ID;
  os: string;
  ipAddress: string;
  status: ComputerStatus;
  shieldEnabled: boolean;
  createdAt: string;
}

export interface Alert {
  id: ID;
  buildingId: ID;
  labId: ID | null;
  computerId: ID | null;
  type: string;
  severity: AlertSeverity;
  description: string;
  attachment: string | null;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: ID;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: ID | null;
  description: string;
}

export interface Settings {
  theme: Theme;
  notifications: {
    securityAlerts: boolean;
    criticalAlerts: boolean;
    emailNotifications: boolean;
  };
  security: {
    shieldConfirmation: boolean;
    loginSecurity: boolean;
  };
}

export interface Session {
  userId: ID | null;
  remember: boolean;
}
