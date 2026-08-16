const PREFIX = 'campusshield:';

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  has(key: string): boolean {
    return localStorage.getItem(PREFIX + key) !== null;
  },
};

export const STORAGE_KEYS = {
  USER: 'user',
  SESSION: 'session',
  BUILDINGS: 'buildings',
  LABS: 'labs',
  COMPUTERS: 'computers',
  ALERTS: 'alerts',
  AUDIT_LOGS: 'auditLogs',
  SETTINGS: 'settings',
  SEEDED: 'seeded',
} as const;
