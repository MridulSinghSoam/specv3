import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Building, BuildingStatus } from '@/types';

const emptyForm = { name: '', code: '', location: '', description: '', status: 'active' as BuildingStatus };

export function BuildingsPage() {
  const { buildings, labs, computers, createBuilding, updateBuilding, deleteBuilding } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BuildingStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [buildings, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (b: Building) => {
    setEditing(b);
    setForm({ name: b.name, code: b.code, location: b.location, description: b.description, status: b.status });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.code.trim()) e.code = 'Code is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateBuilding(editing.id, form);
    } else {
      createBuilding(form);
    }
    setModalOpen(false);
  };

  const labCount = (buildingId: string) => labs.filter((l) => l.buildingId === buildingId).length;
  const computerCount = (buildingId: string) => {
    const labIds = labs.filter((l) => l.buildingId === buildingId).map((l) => l.id);
    return computers.filter((c) => labIds.includes(c.labId)).length;
  };

  const statusVariant = (s: BuildingStatus) =>
    s === 'active' ? 'green' : s === 'maintenance' ? 'amber' : 'gray';

  return (
    <div className="page-container">
      <PageHeader title="BUILDINGS" description="Create and manage campus buildings.">
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Building
        </Button>
      </PageHeader>

      <div className="filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search buildings..." />
        <div className="filter-chips">
          {(['all', 'active', 'maintenance', 'inactive'] as const).map((s) => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="NO BUILDINGS YET"
          message="Add your first building to start organizing your campus infrastructure."
          action={<Button onClick={openCreate}><Plus size={16} /> Add Building</Button>}
          icon={<Building2 size={48} />}
        />
      ) : (
        <div className="card-grid">
          {filtered.map((b) => (
            <div key={b.id} className="entity-card">
              <div className="entity-card-header">
                <div className="entity-card-icon">
                  <Building2 size={20} />
                </div>
                <div className="entity-card-info">
                  <h3 className="entity-card-name">{b.name}</h3>
                  <span className="entity-card-code">{b.code}</span>
                </div>
                <Badge variant={statusVariant(b.status)} dot>{b.status}</Badge>
              </div>
              <p className="entity-card-desc">{b.description || 'No description provided.'}</p>
              <div className="entity-card-meta">
                <span>{b.location}</span>
              </div>
              <div className="entity-card-stats">
                <div className="entity-stat">
                  <span className="entity-stat-value">{labCount(b.id)}</span>
                  <span className="entity-stat-label">Labs</span>
                </div>
                <div className="entity-stat">
                  <span className="entity-stat-value">{computerCount(b.id)}</span>
                  <span className="entity-stat-label">Computers</span>
                </div>
              </div>
              <div className="entity-card-actions">
                <button className="icon-action" onClick={() => openEdit(b)} aria-label="Edit"><Pencil size={15} /></button>
                <button className="icon-action danger" onClick={() => setDeleteId(b.id)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Building' : 'Add Building'}
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit as unknown as () => void} type="submit">{editing ? 'Save Changes' : 'Create Building'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="Engineering Block" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ENG" maxLength={6} />
              {errors.code && <span className="form-error">{errors.code}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, location: e.target.value })} placeholder="North Campus" />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the building..." rows={3} />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BuildingStatus })}>
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
        onConfirm={() => deleteId && deleteBuilding(deleteId)}
        title="Delete Building?"
        message="This will also delete all labs and computers within this building. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
