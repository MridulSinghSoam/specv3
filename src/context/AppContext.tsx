import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
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
import { dataService } from '@/services/dataService';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface AppContextValue {
  // auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => boolean;
  logout: () => void;
  // data
  buildings: Building[];
  labs: Lab[];
  computers: Computer[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  settings: Settings;
  // refresh
  refresh: () => void;
  // buildings
  createBuilding: (data: Omit<Building, 'id' | 'createdAt'>) => void;
  updateBuilding: (id: ID, data: Partial<Building>) => void;
  deleteBuilding: (id: ID) => void;
  // labs
  createLab: (data: Omit<Lab, 'id' | 'createdAt'>) => void;
  updateLab: (id: ID, data: Partial<Lab>) => void;
  deleteLab: (id: ID) => void;
  // computers
  createComputer: (data: Omit<Computer, 'id' | 'createdAt'>) => void;
  updateComputer: (id: ID, data: Partial<Computer>) => void;
  deleteComputer: (id: ID) => void;
  setShield: (computerIds: ID[], enabled: boolean) => void;
  // alerts
  createAlert: (data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAlert: (id: ID, data: Partial<Alert>) => void;
  setAlertStatus: (id: ID, status: AlertStatus) => void;
  // settings
  saveSettings: (settings: Settings) => void;
  // toasts
  toasts: Toast[];
  showToast: (message: string, variant?: Toast['variant']) => void;
  dismissToast: (id: string) => void;
  // loading
  loading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function logAction(action: string, entity: string, entityId: ID | null, description: string, userName: string) {
  dataService.addAuditLog({ user: userName, action, entity, entityId, description });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => dataService.getUser());
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<Settings>(() => dataService.getSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setBuildings(dataService.getBuildings());
    setLabs(dataService.getLabs());
    setComputers(dataService.getComputers());
    setAlerts(dataService.getAlerts());
    setAuditLogs(dataService.getAuditLogs());
    setSettings(dataService.getSettings());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  // theme application
  useEffect(() => {
    const root = document.documentElement;
    const apply = (theme: 'light' | 'dark') => {
      root.setAttribute('data-theme', theme);
    };
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    apply(settings.theme);
  }, [settings.theme]);

  const showToast = useCallback((message: string, variant: Toast['variant'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const userName = currentUser?.name ?? 'System';

  const login = useCallback((email: string, password: string, remember: boolean) => {
    const user = dataService.authenticate(email, password);
    if (user) {
      const session: Session = { userId: user.id, remember };
      dataService.setSession(session);
      setCurrentUser(user);
      dataService.addAuditLog({
        user: user.name,
        action: 'Login',
        entity: 'Session',
        entityId: user.id,
        description: 'User signed in successfully.',
      });
      refresh();
      return true;
    }
    return false;
  }, [refresh]);

  const logout = useCallback(() => {
    dataService.addAuditLog({
      user: userName,
      action: 'Logout',
      entity: 'Session',
      entityId: currentUser?.id ?? null,
      description: 'User signed out.',
    });
    dataService.logout();
    setCurrentUser(null);
    refresh();
  }, [currentUser, userName, refresh]);

  // Buildings
  const createBuilding = useCallback((data: Omit<Building, 'id' | 'createdAt'>) => {
    const b = dataService.createBuilding(data);
    logAction('Building Created', 'Building', b.id, `Building "${b.name}" created.`, userName);
    refresh();
    showToast('Building created successfully');
  }, [refresh, showToast, userName]);

  const updateBuilding = useCallback((id: ID, data: Partial<Building>) => {
    dataService.updateBuilding(id, data);
    const b = dataService.getBuildings().find((x) => x.id === id);
    logAction('Building Edited', 'Building', id, `Building "${b?.name ?? id}" updated.`, userName);
    refresh();
    showToast('Building updated successfully');
  }, [refresh, showToast, userName]);

  const deleteBuilding = useCallback((id: ID) => {
    const b = dataService.getBuildings().find((x) => x.id === id);
    dataService.deleteBuilding(id);
    logAction('Building Deleted', 'Building', id, `Building "${b?.name ?? id}" deleted.`, userName);
    refresh();
    showToast('Building deleted successfully');
  }, [refresh, showToast, userName]);

  // Labs
  const createLab = useCallback((data: Omit<Lab, 'id' | 'createdAt'>) => {
    const l = dataService.createLab(data);
    logAction('Lab Created', 'Lab', l.id, `Lab "${l.name}" created.`, userName);
    refresh();
    showToast('Lab created successfully');
  }, [refresh, showToast, userName]);

  const updateLab = useCallback((id: ID, data: Partial<Lab>) => {
    dataService.updateLab(id, data);
    const l = dataService.getLabs().find((x) => x.id === id);
    logAction('Lab Edited', 'Lab', id, `Lab "${l?.name ?? id}" updated.`, userName);
    refresh();
    showToast('Lab updated successfully');
  }, [refresh, showToast, userName]);

  const deleteLab = useCallback((id: ID) => {
    const l = dataService.getLabs().find((x) => x.id === id);
    dataService.deleteLab(id);
    logAction('Lab Deleted', 'Lab', id, `Lab "${l?.name ?? id}" deleted.`, userName);
    refresh();
    showToast('Lab deleted successfully');
  }, [refresh, showToast, userName]);

  // Computers
  const createComputer = useCallback((data: Omit<Computer, 'id' | 'createdAt'>) => {
    const c = dataService.createComputer(data);
    logAction('Computer Created', 'Computer', c.id, `Computer "${c.name}" created.`, userName);
    refresh();
    showToast('Computer created successfully');
  }, [refresh, showToast, userName]);

  const updateComputer = useCallback((id: ID, data: Partial<Computer>) => {
    dataService.updateComputer(id, data);
    const c = dataService.getComputers().find((x) => x.id === id);
    logAction('Computer Edited', 'Computer', id, `Computer "${c?.name ?? id}" updated.`, userName);
    refresh();
    showToast('Computer updated successfully');
  }, [refresh, showToast, userName]);

  const deleteComputer = useCallback((id: ID) => {
    const c = dataService.getComputers().find((x) => x.id === id);
    dataService.deleteComputer(id);
    logAction('Computer Deleted', 'Computer', id, `Computer "${c?.name ?? id}" deleted.`, userName);
    refresh();
    showToast('Computer deleted successfully');
  }, [refresh, showToast, userName]);

  const setShield = useCallback((computerIds: ID[], enabled: boolean) => {
    dataService.setShield(computerIds, enabled);
    logAction(
      enabled ? 'Shield Enabled' : 'Shield Disabled',
      'Computer',
      null,
      `${enabled ? 'Enabled' : 'Disabled'} shield on ${computerIds.length} computer${computerIds.length !== 1 ? 's' : ''}.`,
      userName
    );
    refresh();
    showToast(enabled ? 'Exam Shield enabled' : 'Exam Shield disabled');
  }, [refresh, showToast, userName]);

  // Alerts
  const createAlert = useCallback((data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) => {
    const a = dataService.createAlert(data);
    logAction('Alert Created', 'Alert', a.id, `${data.severity.charAt(0).toUpperCase() + data.severity.slice(1)} alert: ${data.type}`, userName);
    refresh();
    showToast('Alert created successfully');
  }, [refresh, showToast, userName]);

  const updateAlert = useCallback((id: ID, data: Partial<Alert>) => {
    dataService.updateAlert(id, data);
    logAction('Alert Updated', 'Alert', id, `Alert details updated.`, userName);
    refresh();
    showToast('Alert updated successfully');
  }, [refresh, showToast, userName]);

  const setAlertStatus = useCallback((id: ID, status: AlertStatus) => {
    dataService.setAlertStatus(id, status);
    const action = status === 'resolved' ? 'Alert Resolved' : status === 'dismissed' ? 'Alert Dismissed' : 'Alert Updated';
    logAction(action, 'Alert', id, `Alert status changed to ${status}.`, userName);
    refresh();
    showToast(`Alert ${status}`);
  }, [refresh, showToast, userName]);

  const saveSettings = useCallback((s: Settings) => {
    dataService.saveSettings(s);
    logAction('Settings Changed', 'Settings', null, 'Application settings updated.', userName);
    setSettings(s);
    showToast('Settings saved successfully');
  }, [showToast, userName]);

  const value: AppContextValue = {
    currentUser,
    isAuthenticated: currentUser !== null,
    login,
    logout,
    buildings,
    labs,
    computers,
    alerts,
    auditLogs,
    settings,
    refresh,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createLab,
    updateLab,
    deleteLab,
    createComputer,
    updateComputer,
    deleteComputer,
    setShield,
    createAlert,
    updateAlert,
    setAlertStatus,
    saveSettings,
    toasts,
    showToast,
    dismissToast,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
