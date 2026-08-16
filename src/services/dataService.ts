import type {
  User,
  Building,
  Lab,
  Computer,
  Alert,
  AuditLog,
  Settings,
  Session,
  ID,
  AlertStatus,
} from '@/types';
import { storage, STORAGE_KEYS } from './storage';
import {
  DEMO_USER,
  DEFAULT_SETTINGS,
  seedBuildings,
  seedLabs,
  seedComputers,
  seedAlerts,
  seedAuditLogs,
} from './seedData';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function ensureSeed(): void {
  if (storage.has(STORAGE_KEYS.SEEDED)) return;
  storage.set(STORAGE_KEYS.BUILDINGS, seedBuildings());
  storage.set(STORAGE_KEYS.LABS, seedLabs());
  storage.set(STORAGE_KEYS.COMPUTERS, seedComputers());
  storage.set(STORAGE_KEYS.ALERTS, seedAlerts());
  storage.set(STORAGE_KEYS.AUDIT_LOGS, seedAuditLogs(DEMO_USER.name));
  storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  storage.set(STORAGE_KEYS.SEEDED, true);
}

ensureSeed();

export const dataService = {
  // ---- User / Auth ----
  getUser(): User | null {
    return storage.get<User>(STORAGE_KEYS.USER);
  },
  authenticate(email: string, password: string): User | null {
    if (email.trim().toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) {
      storage.set(STORAGE_KEYS.USER, DEMO_USER);
      return DEMO_USER;
    }
    return null;
  },
  logout(): void {
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.SESSION);
  },
  getSession(): Session {
    return storage.get<Session>(STORAGE_KEYS.SESSION) ?? { userId: null, remember: false };
  },
  setSession(session: Session): void {
    storage.set(STORAGE_KEYS.SESSION, session);
  },

  // ---- Settings ----
  getSettings(): Settings {
    return storage.get<Settings>(STORAGE_KEYS.SETTINGS) ?? DEFAULT_SETTINGS;
  },
  saveSettings(settings: Settings): void {
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  },

  // ---- Buildings ----
  getBuildings(): Building[] {
    return storage.get<Building[]>(STORAGE_KEYS.BUILDINGS) ?? [];
  },
  saveBuildings(buildings: Building[]): void {
    storage.set(STORAGE_KEYS.BUILDINGS, buildings);
  },
  createBuilding(data: Omit<Building, 'id' | 'createdAt'>): Building {
    const building: Building = { ...data, id: uid('bld'), createdAt: new Date().toISOString() };
    const buildings = this.getBuildings();
    this.saveBuildings([building, ...buildings]);
    return building;
  },
  updateBuilding(id: ID, data: Partial<Building>): void {
    const buildings = this.getBuildings().map((b) => (b.id === id ? { ...b, ...data } : b));
    this.saveBuildings(buildings);
  },
  deleteBuilding(id: ID): void {
    const labIds = this.getLabs().filter((l) => l.buildingId === id).map((l) => l.id);
    const computerIds = this.getComputers().filter((c) => labIds.includes(c.labId)).map((c) => c.id);
    this.saveBuildings(this.getBuildings().filter((b) => b.id !== id));
    this.saveLabs(this.getLabs().filter((l) => l.buildingId !== id));
    this.saveComputers(this.getComputers().filter((c) => !labIds.includes(c.labId)));
    this.saveAlerts(this.getAlerts().filter((a) => a.buildingId !== id));
    void computerIds;
  },

  // ---- Labs ----
  getLabs(): Lab[] {
    return storage.get<Lab[]>(STORAGE_KEYS.LABS) ?? [];
  },
  saveLabs(labs: Lab[]): void {
    storage.set(STORAGE_KEYS.LABS, labs);
  },
  createLab(data: Omit<Lab, 'id' | 'createdAt'>): Lab {
    const lab: Lab = { ...data, id: uid('lab'), createdAt: new Date().toISOString() };
    const labs = this.getLabs();
    this.saveLabs([lab, ...labs]);
    return lab;
  },
  updateLab(id: ID, data: Partial<Lab>): void {
    const labs = this.getLabs().map((l) => (l.id === id ? { ...l, ...data } : l));
    this.saveLabs(labs);
  },
  deleteLab(id: ID): void {
    this.saveLabs(this.getLabs().filter((l) => l.id !== id));
    this.saveComputers(this.getComputers().filter((c) => c.labId !== id));
    this.saveAlerts(this.getAlerts().filter((a) => a.labId !== id));
  },

  // ---- Computers ----
  getComputers(): Computer[] {
    return storage.get<Computer[]>(STORAGE_KEYS.COMPUTERS) ?? [];
  },
  saveComputers(computers: Computer[]): void {
    storage.set(STORAGE_KEYS.COMPUTERS, computers);
  },
  createComputer(data: Omit<Computer, 'id' | 'createdAt'>): Computer {
    const computer: Computer = { ...data, id: uid('cmp'), createdAt: new Date().toISOString() };
    const computers = this.getComputers();
    this.saveComputers([computer, ...computers]);
    return computer;
  },
  updateComputer(id: ID, data: Partial<Computer>): void {
    const computers = this.getComputers().map((c) => (c.id === id ? { ...c, ...data } : c));
    this.saveComputers(computers);
  },
  deleteComputer(id: ID): void {
    this.saveComputers(this.getComputers().filter((c) => c.id !== id));
    this.saveAlerts(this.getAlerts().filter((a) => a.computerId !== id));
  },
  setShield(computerIds: ID[], enabled: boolean): void {
    const computers = this.getComputers().map((c) =>
      computerIds.includes(c.id) ? { ...c, shieldEnabled: enabled } : c
    );
    this.saveComputers(computers);
  },

  // ---- Alerts ----
  getAlerts(): Alert[] {
    return storage.get<Alert[]>(STORAGE_KEYS.ALERTS) ?? [];
  },
  saveAlerts(alerts: Alert[]): void {
    storage.set(STORAGE_KEYS.ALERTS, alerts);
  },
  createAlert(data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Alert {
    const now = new Date().toISOString();
    const alert: Alert = { ...data, id: uid('alt'), createdAt: now, updatedAt: now };
    this.saveAlerts([alert, ...this.getAlerts()]);
    return alert;
  },
  updateAlert(id: ID, data: Partial<Alert>): void {
    const alerts = this.getAlerts().map((a) =>
      a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
    );
    this.saveAlerts(alerts);
  },
  setAlertStatus(id: ID, status: AlertStatus): void {
    this.updateAlert(id, { status });
  },

  // ---- Audit Logs ----
  getAuditLogs(): AuditLog[] {
    return storage.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS) ?? [];
  },
  saveAuditLogs(logs: AuditLog[]): void {
    storage.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const entry: AuditLog = {
      ...log,
      id: uid('log'),
      timestamp: new Date().toISOString(),
    };
    this.saveAuditLogs([entry, ...this.getAuditLogs()]);
  },

  // ---- Reset ----
  resetAll(): void {
    storage.remove(STORAGE_KEYS.BUILDINGS);
    storage.remove(STORAGE_KEYS.LABS);
    storage.remove(STORAGE_KEYS.COMPUTERS);
    storage.remove(STORAGE_KEYS.ALERTS);
    storage.remove(STORAGE_KEYS.AUDIT_LOGS);
    storage.remove(STORAGE_KEYS.SETTINGS);
    storage.remove(STORAGE_KEYS.SEEDED);
    ensureSeed();
  },
};
