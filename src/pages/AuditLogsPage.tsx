import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollText, LogIn, LogOut, Plus, Pencil, Trash2, ShieldCheck, ShieldOff, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const actionIcons: Record<string, LucideIcon> = {
  'Login': LogIn,
  'Logout': LogOut,
  'Building Created': Plus,
  'Building Edited': Pencil,
  'Building Deleted': Trash2,
  'Lab Created': Plus,
  'Lab Edited': Pencil,
  'Lab Deleted': Trash2,
  'Computer Created': Plus,
  'Computer Edited': Pencil,
  'Computer Deleted': Trash2,
  'Shield Enabled': ShieldCheck,
  'Shield Disabled': ShieldOff,
  'Alert Created': AlertTriangle,
  'Alert Updated': AlertTriangle,
  'Alert Resolved': ShieldCheck,
  'Alert Dismissed': ShieldOff,
  'Settings Changed': SettingsIcon,
};

export function AuditLogsPage() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const uniqueActions = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.action));
    return Array.from(set).sort();
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchSearch =
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === 'all' || l.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [auditLogs, search, actionFilter]);

  return (
    <div className="page-container">
      <PageHeader title="AUDIT LOGS" description="Complete record of all security-relevant actions." />

      <div className="filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search logs by user, action, or description..." />
        <select className="filter-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="NO LOGS FOUND"
          message="No audit logs match your current filters."
          icon={<ScrollText size={48} />}
        />
      ) : (
        <div className="audit-timeline">
          {filtered.map((log) => {
            const Icon = actionIcons[log.action] ?? ScrollText;
            const isSystem = log.user === 'System';
            return (
              <div key={log.id} className="audit-timeline-item">
                <div className={`audit-timeline-marker ${isSystem ? 'system' : ''}`}>
                  <Icon size={16} />
                </div>
                <div className="audit-timeline-content">
                  <div className="audit-timeline-top">
                    <span className="audit-timeline-action">{log.action}</span>
                    <span className="audit-timeline-time">{formatTime(log.timestamp)}</span>
                  </div>
                  <p className="audit-timeline-desc">{log.description}</p>
                  <div className="audit-timeline-meta">
                    <span className="audit-timeline-user">{log.user}</span>
                    {log.entity && <><span className="meta-sep">·</span><span className="audit-timeline-entity">{log.entity}</span></>}
                    <span className="meta-sep">·</span>
                    <span className="audit-timeline-relative">{formatRelative(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
