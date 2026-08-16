import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldStatus } from '@/components/ui/ShieldStatus';
import { Computer as ComputerIcon, Plus, Pencil, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import type { Computer, ComputerStatus } from '@/types';

const emptyForm = (labId: string) => ({
  name: '',
  assetId: '',
  labId,
  os: 'Windows 11 Pro',
  ipAddress: '',
  status: 'active' as ComputerStatus,
  shieldEnabled: false,
});

const osOptions = ['Windows 11 Pro', 'Windows 10 Pro', 'Ubuntu 22.04 LTS', 'macOS Sonoma', 'Fedora 39'];

export function ComputersPage() {
  const { computers, labs, buildings, createComputer, updateComputer, deleteComputer, setShield } = useApp();
  const [search, setSearch] = useState('');
  const [labFilter, setLabFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ComputerStatus | 'shielded' | 'unshielded'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Computer | null>(null);
  const [form, setForm] = useState(emptyForm(labs[0]?.id ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return computers.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.assetId.toLowerCase().includes(search.toLowerCase()) || c.ipAddress.includes(search);
      const matchLab = labFilter === 'all' || c.labId === labFilter;
      const lab = labs.find((l) => l.id === c.labId);
      const matchBuilding = buildingFilter === 'all' || lab?.buildingId === buildingFilter;
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'shielded' ? c.shieldEnabled :
        statusFilter === 'unshielded' ? !c.shieldEnabled :
        c.status === statusFilter;
      return matchSearch && matchLab && matchBuilding && matchStatus;
    });
  }, [computers, labs, search, labFilter, buildingFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(labs[0]?.id ?? ''));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Computer) => {
    setEditing(c);
    setForm({ name: c.name, assetId: c.assetId, labId: c.labId, os: c.os, ipAddress: c.ipAddress, status: c.status, shieldEnabled: c.shieldEnabled });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Computer name is required';
    if (!form.assetId.trim()) e.assetId = 'Asset ID is required';
    if (!form.labId) e.labId = 'Lab is required';
    if (!form.ipAddress.trim()) e.ipAddress = 'IP address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateComputer(editing.id, form);
    } else {
      createComputer(form);
    }
    setModalOpen(false);
  };

  const labName = (id: string) => labs.find((l) => l.id === id)?.name ?? 'Unknown';
  const buildingName = (labId: string) => {
    const lab = labs.find((l) => l.id === labId);
    const b = buildings.find((b) => b.id === lab?.buildingId);
    return b?.name ?? 'Unknown';
  };

  const statusVariant = (s: ComputerStatus) => s === 'active' ? 'green' : s === 'maintenance' ? 'amber' : 'gray';

  return (
    <div className="page-container">
      <PageHeader title="COMPUTERS" description="Create and manage individual computer assets.">
        <Button onClick={openCreate} disabled={labs.length === 0}>
          <Plus size={16} /> Add Computer
        </Button>
      </PageHeader>

      <div className="filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, asset ID, or IP..." />
        <select className="filter-select" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="filter-select" value={labFilter} onChange={(e) => setLabFilter(e.target.value)}>
          <option value="all">All Labs</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <div className="filter-chips">
          {(['all', 'active', 'maintenance', 'offline', 'shielded', 'unshielded'] as const).map((s) => (
            <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="NO COMPUTERS YET"
          message="Add your first computer to start tracking and protecting individual assets."
          action={<Button onClick={openCreate} disabled={labs.length === 0}><Plus size={16} /> Add Computer</Button>}
          icon={<ComputerIcon size={48} />}
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Computer</th>
                <th>Asset ID</th>
                <th>Lab</th>
                <th>Building</th>
                <th>OS</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Shield</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="table-primary">{c.name}</span></td>
                  <td><span className="table-secondary">{c.assetId}</span></td>
                  <td>{labName(c.labId)}</td>
                  <td>{buildingName(c.labId)}</td>
                  <td><span className="table-secondary">{c.os}</span></td>
                  <td><span className="table-mono">{c.ipAddress}</span></td>
                  <td><Badge variant={statusVariant(c.status)} dot>{c.status}</Badge></td>
                  <td>
                    <ShieldStatus status={c.shieldEnabled ? 'protected' : 'unprotected'} size="sm" />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-action" onClick={() => setShield([c.id], !c.shieldEnabled)} title={c.shieldEnabled ? 'Disable shield' : 'Enable shield'}>
                        {c.shieldEnabled ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                      </button>
                      <button className="icon-action" onClick={() => openEdit(c)} aria-label="Edit"><Pencil size={15} /></button>
                      <button className="icon-action danger" onClick={() => setDeleteId(c.id)} aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Computer' : 'Add Computer'}
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit as unknown as () => void} type="submit">{editing ? 'Save Changes' : 'Create Computer'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Computer Name</label>
              <input className="form-input" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="PC-001" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Asset ID</label>
              <input className="form-input" value={form.assetId} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, assetId: e.target.value })} placeholder="AST-0001" />
              {errors.assetId && <span className="form-error">{errors.assetId}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Lab</label>
              <select className="form-select" value={form.labId} onChange={(e) => setForm({ ...form, labId: e.target.value })}>
                <option value="">Select lab...</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {errors.labId && <span className="form-error">{errors.labId}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">IP Address</label>
              <input className="form-input" value={form.ipAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, ipAddress: e.target.value })} placeholder="10.1.1.10" />
              {errors.ipAddress && <span className="form-error">{errors.ipAddress}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Operating System</label>
              <select className="form-select" value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })}>
                {osOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ComputerStatus })}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.shieldEnabled} onChange={(e) => setForm({ ...form, shieldEnabled: e.target.checked })} />
              <span className="checkbox-custom" />
              Enable Exam Shield
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteComputer(deleteId)}
        title="Delete Computer?"
        message="This will permanently remove this computer and its associated alerts. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
