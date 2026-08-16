import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Server, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Lab, LabStatus } from '@/types';

const emptyForm = (buildingId: string) => ({ name: '', code: '', buildingId, capacity: 30, status: 'active' as LabStatus });

export function LabsPage() {
  const { labs, buildings, computers, createLab, updateLab, deleteLab } = useApp();
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LabStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [form, setForm] = useState(emptyForm(buildings[0]?.id ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return labs.filter((l) => {
      const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase());
      const matchBuilding = buildingFilter === 'all' || l.buildingId === buildingFilter;
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchBuilding && matchStatus;
    });
  }, [labs, search, buildingFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(buildings[0]?.id ?? ''));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (l: Lab) => {
    setEditing(l);
    setForm({ name: l.name, code: l.code, buildingId: l.buildingId, capacity: l.capacity, status: l.status });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.code.trim()) e.code = 'Code is required';
    if (!form.buildingId) e.buildingId = 'Building is required';
    if (form.capacity < 1) e.capacity = 'Capacity must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateLab(editing.id, form);
    } else {
      createLab(form);
    }
    setModalOpen(false);
  };

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? 'Unknown';
  const computerCount = (labId: string) => computers.filter((c) => c.labId === labId).length;
  const protectedCount = (labId: string) => computers.filter((c) => c.labId === labId && c.shieldEnabled).length;

  const statusVariant = (s: LabStatus) => s === 'active' ? 'green' : s === 'maintenance' ? 'amber' : 'gray';

  return (
    <div className="page-container">
      <PageHeader title="LABS" description="Create and manage computer laboratories.">
        <Button onClick={openCreate} disabled={buildings.length === 0}>
          <Plus size={16} /> Add Lab
        </Button>
      </PageHeader>

      <div className="filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search labs..." />
        <select className="filter-select" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="filter-chips">
          {(['all', 'active', 'maintenance', 'inactive'] as const).map((s) => (
            <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="NO LABS YET"
          message="Add your first computer lab to start managing computing resources."
          action={<Button onClick={openCreate} disabled={buildings.length === 0}><Plus size={16} /> Add Lab</Button>}
          icon={<Server size={48} />}
        />
      ) : (
        <div className="card-grid">
          {filtered.map((l) => (
            <div key={l.id} className="entity-card">
              <div className="entity-card-header">
                <div className="entity-card-icon"><Server size={20} /></div>
                <div className="entity-card-info">
                  <h3 className="entity-card-name">{l.name}</h3>
                  <span className="entity-card-code">{l.code}</span>
                </div>
                <Badge variant={statusVariant(l.status)} dot>{l.status}</Badge>
              </div>
              <div className="entity-card-meta">
                <span>{buildingName(l.buildingId)}</span>
              </div>
              <div className="entity-card-stats">
                <div className="entity-stat">
                  <span className="entity-stat-value">{l.capacity}</span>
                  <span className="entity-stat-label">Capacity</span>
                </div>
                <div className="entity-stat">
                  <span className="entity-stat-value">{computerCount(l.id)}</span>
                  <span className="entity-stat-label">Computers</span>
                </div>
                <div className="entity-stat">
                  <span className="entity-stat-value">{protectedCount(l.id)}</span>
                  <span className="entity-stat-label">Protected</span>
                </div>
              </div>
              <div className="entity-card-actions">
                <button className="icon-action" onClick={() => openEdit(l)} aria-label="Edit"><Pencil size={15} /></button>
                <button className="icon-action danger" onClick={() => setDeleteId(l.id)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Lab' : 'Add Lab'}
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit as unknown as () => void} type="submit">{editing ? 'Save Changes' : 'Create Lab'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="Computer Lab 01" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CL01" maxLength={6} />
              {errors.code && <span className="form-error">{errors.code}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Capacity</label>
              <input type="number" className="form-input" value={form.capacity} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: Number(e.target.value) })} min={1} />
              {errors.capacity && <span className="form-error">{errors.capacity}</span>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Building</label>
            <select className="form-select" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>
              <option value="">Select building...</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.buildingId && <span className="form-error">{errors.buildingId}</span>}
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LabStatus })}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteLab(deleteId)}
        title="Delete Lab?"
        message="This will also delete all computers within this lab. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
