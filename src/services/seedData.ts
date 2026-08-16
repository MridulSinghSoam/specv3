import type {
  User,
  Building,
  Lab,
  Computer,
  Alert,
  AuditLog,
  Settings,
} from '@/types';

export const DEMO_USER: User = {
  id: 'user-001',
  name: 'Dr. Arjun Mehta',
  email: 'admin@campusshield.edu',
  password: 'Admin@123',
  role: 'Campus Security Administrator',
  avatarColor: '#6B2F12',
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  notifications: {
    securityAlerts: true,
    criticalAlerts: true,
    emailNotifications: false,
  },
  security: {
    shieldConfirmation: true,
    loginSecurity: true,
  },
};

export function seedBuildings(): Building[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'bld-001',
      name: 'Engineering Block',
      code: 'ENG',
      location: 'North Campus',
      description: 'Main engineering faculty building housing computer labs and lecture halls.',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'bld-002',
      name: 'Science Tower',
      code: 'SCI',
      location: 'Central Campus',
      description: 'Science departments with research laboratories and computing facilities.',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'bld-003',
      name: 'Business School',
      code: 'BUS',
      location: 'East Campus',
      description: 'School of management and business studies with dedicated computer labs.',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'bld-004',
      name: 'Research Annex',
      code: 'RSR',
      location: 'South Campus',
      description: 'Advanced research facility with secure computing environments.',
      status: 'maintenance',
      createdAt: now,
    },
  ];
}

export function seedLabs(): Lab[] {
  const now = new Date().toISOString();
  return [
    { id: 'lab-001', name: 'Computer Lab 01', code: 'CL01', buildingId: 'bld-001', capacity: 40, status: 'active', createdAt: now },
    { id: 'lab-002', name: 'Computer Lab 02', code: 'CL02', buildingId: 'bld-001', capacity: 36, status: 'active', createdAt: now },
    { id: 'lab-003', name: 'Computer Lab 03', code: 'CL03', buildingId: 'bld-001', capacity: 30, status: 'active', createdAt: now },
    { id: 'lab-004', name: 'Physics Computing Lab', code: 'PCL', buildingId: 'bld-002', capacity: 24, status: 'active', createdAt: now },
    { id: 'lab-005', name: 'Chemistry Data Lab', code: 'CDL', buildingId: 'bld-002', capacity: 20, status: 'maintenance', createdAt: now },
    { id: 'lab-006', name: 'MBA Lab', code: 'MBA', buildingId: 'bld-003', capacity: 32, status: 'active', createdAt: now },
    { id: 'lab-007', name: 'Finance Lab', code: 'FIN', buildingId: 'bld-003', capacity: 28, status: 'active', createdAt: now },
    { id: 'lab-008', name: 'Secure Research Lab', code: 'SRL', buildingId: 'bld-004', capacity: 16, status: 'active', createdAt: now },
  ];
}

export function seedComputers(): Computer[] {
  const now = new Date().toISOString();
  const computers: Computer[] = [];
  const labComputerMap: Record<string, { count: number; prefix: string }> = {
    'lab-001': { count: 6, prefix: 'PC' },
    'lab-002': { count: 5, prefix: 'PC' },
    'lab-003': { count: 4, prefix: 'PC' },
    'lab-004': { count: 4, prefix: 'WS' },
    'lab-005': { count: 3, prefix: 'WS' },
    'lab-006': { count: 5, prefix: 'PC' },
    'lab-007': { count: 4, prefix: 'PC' },
    'lab-008': { count: 3, prefix: 'SR' },
  };

  let pcNum = 1;
  let wsNum = 101;
  let srNum = 201;
  const oses = ['Windows 11 Pro', 'Windows 10 Pro', 'Ubuntu 22.04 LTS', 'macOS Sonoma'];

  for (const [labId, config] of Object.entries(labComputerMap)) {
    for (let i = 0; i < config.count; i++) {
      const prefix = config.prefix;
      let num: number;
      let name: string;
      if (prefix === 'PC') {
        num = pcNum++;
        name = `PC-${String(num).padStart(3, '0')}`;
      } else if (prefix === 'WS') {
        num = wsNum++;
        name = `WS-${num}`;
      } else {
        num = srNum++;
        name = `SR-${num}`;
      }
      const shield = Math.random() > 0.35;
      const status = i === config.count - 1 && Math.random() > 0.7 ? 'maintenance' : 'active';
      computers.push({
        id: `cmp-${computers.length + 1}`.padStart(7, '0'),
        name,
        assetId: `AST-${String(1000 + computers.length).padStart(4, '0')}`,
        labId,
        os: oses[i % oses.length],
        ipAddress: `10.${Math.floor(computers.length / 50) + 1}.${Math.floor(computers.length % 50) + 1}.${computers.length + 10}`,
        status: status as Computer['status'],
        shieldEnabled: shield,
        createdAt: now,
      });
    }
  }
  return computers;
}

export function seedAlerts(): Alert[] {
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60000).toISOString();

  return [
    {
      id: 'alt-001',
      buildingId: 'bld-001',
      labId: 'lab-003',
      computerId: 'cmp-013',
      type: 'Unauthorized USB Device',
      severity: 'high',
      description: 'An unauthorized USB mass storage device was detected and blocked on PC-104 during exam hours.',
      attachment: null,
      status: 'open',
      createdAt: mins(8),
      updatedAt: mins(8),
    },
    {
      id: 'alt-002',
      buildingId: 'bld-002',
      labId: 'lab-004',
      computerId: 'cmp-015',
      type: 'Screen Sharing Detected',
      severity: 'critical',
      description: 'Remote screen sharing application detected during active examination on workstation WS-101.',
      attachment: 'incident-001.log',
      status: 'investigating',
      createdAt: mins(34),
      updatedAt: mins(12),
    },
    {
      id: 'alt-003',
      buildingId: 'bld-001',
      labId: 'lab-001',
      computerId: 'cmp-001',
      type: 'Browser Extension Violation',
      severity: 'medium',
      description: 'Disallowed browser extension with auto-answer capability flagged on PC-001.',
      attachment: null,
      status: 'open',
      createdAt: mins(95),
      updatedAt: mins(95),
    },
    {
      id: 'alt-004',
      buildingId: 'bld-003',
      labId: 'lab-006',
      computerId: 'cmp-022',
      type: 'Process Tampering',
      severity: 'critical',
      description: 'ExamShield monitoring process was terminated unexpectedly on PC in MBA Lab.',
      attachment: 'proc-dump.txt',
      status: 'resolved',
      createdAt: mins(240),
      updatedAt: mins(180),
    },
    {
      id: 'alt-005',
      buildingId: 'bld-001',
      labId: 'lab-002',
      computerId: 'cmp-007',
      type: 'Network Anomaly',
      severity: 'low',
      description: 'Unusual outbound network traffic detected from PC-007. Investigated and cleared as system update.',
      attachment: null,
      status: 'dismissed',
      createdAt: mins(320),
      updatedAt: mins(300),
    },
    {
      id: 'alt-006',
      buildingId: 'bld-004',
      labId: 'lab-008',
      computerId: null,
      type: 'Unauthorized Access',
      severity: 'high',
      description: 'After-hours access attempt to Secure Research Lab without scheduled session.',
      attachment: null,
      status: 'investigating',
      createdAt: mins(150),
      updatedAt: mins(60),
    },
  ];
}

export function seedAuditLogs(userName: string): AuditLog[] {
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60000).toISOString();
  return [
    { id: 'log-001', timestamp: mins(8), user: userName, action: 'Shield Disabled', entity: 'Computer', entityId: 'cmp-013', description: 'Shield disabled on PC-104 during USB incident investigation.' },
    { id: 'log-002', timestamp: mins(34), user: 'System', action: 'Alert Created', entity: 'Alert', entityId: 'alt-002', description: 'Critical alert: Screen sharing detected on WS-101.' },
    { id: 'log-003', timestamp: mins(95), user: userName, action: 'Alert Created', entity: 'Alert', entityId: 'alt-003', description: 'Medium alert: Browser extension violation on PC-001.' },
    { id: 'log-004', timestamp: mins(180), user: userName, action: 'Alert Resolved', entity: 'Alert', entityId: 'alt-004', description: 'Process tampering alert resolved.' },
    { id: 'log-005', timestamp: mins(320), user: userName, action: 'Alert Dismissed', entity: 'Alert', entityId: 'alt-005', description: 'Network anomaly dismissed after investigation.' },
    { id: 'log-006', timestamp: mins(720), user: userName, action: 'Building Created', entity: 'Building', entityId: 'bld-004', description: 'Research Annex added to South Campus.' },
    { id: 'log-007', timestamp: mins(1440), user: userName, action: 'Lab Created', entity: 'Lab', entityId: 'lab-008', description: 'Secure Research Lab created in Research Annex.' },
    { id: 'log-008', timestamp: mins(2880), user: userName, action: 'Settings Changed', entity: 'Settings', entityId: null, description: 'Shield confirmation requirement enabled.' },
  ];
}
