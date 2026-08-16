import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertTriangle, Plus } from 'lucide-react';
import type { Alert, AlertSeverity, AlertStatus } from '@/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const alertTypes = [
  'Unauthorized USB Device',
  'Screen Sharing Detected',
  'Browser Extension Violation',
  'Process Tampering',
  'Network Anomaly',
  'Unauthorized Access',
  'Software Violation',
  'Identity Mismatch',
];

const emptyForm = (buildingId: string) => ({
  buildingId,
  labId: '' as string,
  computerId: '' as string | null,
  type: alertTypes[0],
  severity: 'medium' as AlertSeverity,
  description: '',
  attachment: '' as string | null,
  status: 'open' as AlertStatus,
});

type SortKey = 'newest' | 'oldest' | 'severity';

const severityRank: Record<AlertSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function AlertsPage() {
  const { alerts, buildings, labs, computers, createAlert, updateAlert, setAlertStatus } = useApp();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Alert | null>(null);
  const [form, setForm] = useState(emptyForm(buildings[0]?.id ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let result = alerts.filter((a) => {
      const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchBuilding = buildingFilter === 'all' || a.buildingId === buildingFilter;
      return matchSearch && matchSeverity && matchStatus && matchBuilding;
    });
    result = [...result].sort((a, b) => {
      if (sortKey === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return severityRank[b.severity] - severityRank[a.severity];
    });
    return result;
  }, [alerts, search, severityFilter, statusFilter, buildingFilter, sortKey]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm(buildings[0]?.id ?? ''));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (a: Alert) => {
    setEditTarget(a);
    setForm({
      buildingId: a.buildingId,
      labId: a.labId ?? '',
      computerId: a.computerId ?? '',
      type: a.type,
      severity: a.severity,
      description: a.description,
      attachment: a.attachment,
      status: a.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.buildingId) e.buildingId = 'Building is required';
    if (!form.type.trim()) e.type = 'Alert type is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      buildingId: form.buildingId,
      labId: form.labId || null,
      computerId: form.computerId || null,
      type: form.type,
      severity: form.severity,
      description: form.description,
      attachment: form.attachment || null,
      status: form.status,
    };
    if (editTarget) {
      updateAlert(editTarget.id, data);
    } else {
      createAlert(data);
    }
    setModalOpen(false);
  };

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? 'Unknown';
  const labName = (id: string | null) => (id ? labs.find((l) => l.id === id)?.name ?? 'Unknown' : null);
  const computerName = (id: string | null) => (id ? computers.find((c) => c.id === id)?.name ?? 'Unknown' : null);

  const availableLabs = labs.filter((l) => l.buildingId === form.buildingId);
  const availableComputers = computers.filter((c) => c.labId === form.labId);

  const statusVariant = (s: AlertStatus): 'green' | 'amber' | 'red' | 'gray' =>
    s === 'resolved' ? 'green' : s === 'investigating' ? ('blue' as never) : s === 'dismissed' ? 'gray' : 'red';

  return (
    <div className="page-container">
      <PageHeader title="ALERTS" description="Track, investigate, and resolve security incidents.">
        <Button onClick={openCreate}><Plus size={16} /> New Alert</Button>
      </PageHeader>

      <div className="filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search alerts..." />
        <select className="filter-select" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="filter-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="severity">By Severity</option>
        </select>
        <div className="filter-chips">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button key={s} className={`filter-chip ${severityFilter === s ? 'active' : ''}`} onClick={() => setSeverityFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {(['all', 'open', 'investigating', 'resolved', 'dismissed'] as const).map((s) => (
            <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="NO ALERTS FOUND"
          message="No alerts match your current filters. Try adjusting your search or create a new alert."
          action={<Button onClick={openCreate}><Plus size={16} /> New Alert</Button>}
          icon={<AlertTriangle size={48} />}
        />
      ) : (
        <div className="alerts-list">
          {filtered.map((alert) => (
            <div key={alert.id} className={`alert-card severity-border-${alert.severity}`}>
              <div className={`alert-severity-badge severity-${alert.severity}`}>
                {alert.severity.toUpperCase()}
              </div>
              <div className="alert-card-body">
                <div className="alert-card-top">
                  <h3 className="alert-card-title">{alert.type}</h3>
                  <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                </div>
                <p className="alert-card-desc">{alert.description}</p>
                <div className="alert-card-meta">
                  <span>{buildingName(alert.buildingId)}</span>
                  {labName(alert.labId) && <><span className="meta-sep">·</span><span>{labName(alert.labId)}</span></>}
                  {computerName(alert.computerId) && <><span className="meta-sep">·</span><span>{computerName(alert.computerId)}</span></>}
                  <span className="meta-sep">·</span>
                  <span className="alert-card-time">{timeAgo(alert.createdAt)}</span>
                  {alert.attachment && <><span className="meta-sep">·</span><span className="alert-attachment">📎 {alert.attachment}</span></>}
                </div>
              </div>
              <div className="alert-card-actions">
                <button className="alert-action-btn" onClick={() => openEdit(alert)}>Edit</button>
                {alert.status !== 'investigating' && (
                  <button className="alert-action-btn" onClick={() => setAlertStatus(alert.id, 'investigating')}>Investigate</button>
                )}
                {alert.status !== 'resolved' && (
                  <button className="alert-action-btn resolve" onClick={() => setAlertStatus(alert.id, 'resolved')}>Resolve</button>
                )}
                {alert.status !== 'dismissed' && (
                  <button className="alert-action-btn dismiss" onClick={() => setAlertStatus(alert.id, 'dismissed')}>Dismiss</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Alert' : 'New Alert'}
        size="lg"
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit as unknown as () => void} type="submit">{editTarget ? 'Save Changes' : 'Create Alert'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Building</label>
              <select className="form-select" value={form.buildingId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, buildingId: e.target.value, labId: '', computerId: '' })}>
                <option value="">Select building...</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.buildingId && <span className="form-error">{errors.buildingId}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Lab</label>
              <select className="form-select" value={form.labId} onChange={(e) => setForm({ ...form, labId: e.target.value, computerId: '' })} disabled={!form.buildingId}>
                <option value="">No specific lab</option>
                {availableLabs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Computer</label>
              <select className="form-select" value={form.computerId ?? ''} onChange={(e) => setForm({ ...form, computerId: e.target.value })} disabled={!form.labId}>
                <option value="">No specific computer</option>
                {availableComputers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.assetId}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Alert Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {alertTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Severity</label>
              <select className="form-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as AlertSeverity })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AlertStatus })}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the security incident..." rows={4} />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>
          <div className="form-field">
            <label className="form-label">Attachment (filename)</label>
            <input className="form-input" value={form.attachment ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, attachment: e.target.value })} placeholder="e.g. incident-log.txt" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
