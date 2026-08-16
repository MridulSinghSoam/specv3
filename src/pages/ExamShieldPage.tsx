import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShieldStatus } from '@/components/ui/ShieldStatus';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, ShieldOff, ChevronDown, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import type { ShieldStatus as ShieldStatusType, ID, BuildingStatus, LabStatus, ComputerStatus } from '@/types';

function computeLabShield(labId: string, computers: { labId: string; shieldEnabled: boolean }[]): ShieldStatusType {
  const labComputers = computers.filter((c) => c.labId === labId);
  if (labComputers.length === 0) return 'unprotected';
  const protectedCount = labComputers.filter((c) => c.shieldEnabled).length;
  if (protectedCount === labComputers.length) return 'protected';
  if (protectedCount > 0) return 'partially';
  return 'unprotected';
}

function computeBuildingShield(buildingId: string, labs: { id: string; buildingId: string }[], computers: { labId: string; shieldEnabled: boolean }[]): ShieldStatusType {
  const buildingLabs = labs.filter((l) => l.buildingId === buildingId);
  if (buildingLabs.length === 0) return 'unprotected';
  const statuses = buildingLabs.map((l) => computeLabShield(l.id, computers));
  if (statuses.every((s) => s === 'protected')) return 'protected';
  if (statuses.every((s) => s === 'unprotected')) return 'unprotected';
  return 'partially';
}

const osOptions = ['Windows 11 Pro', 'Windows 10 Pro', 'Ubuntu 22.04 LTS', 'macOS Sonoma', 'Fedora 39'];

export function ExamShieldPage() {
  const {
    buildings, labs, computers, setShield, settings,
    createBuilding, createLab, deleteLab, createComputer,
  } = useApp();

  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set(buildings.map((b) => b.id)));
  const [expandedLabs, setExpandedLabs] = useState<Set<string>>(new Set(labs.map((l) => l.id)));
  const [selectedComputers, setSelectedComputers] = useState<Set<ID>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ enable: boolean; count: number; ids: ID[] } | null>(null);

  // Building modal
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', location: '', description: '', status: 'active' as BuildingStatus });
  const [buildingErrors, setBuildingErrors] = useState<Record<string, string>>({});

  // Lab modal
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labTargetBuildingId, setLabTargetBuildingId] = useState<string>('');
  const [labForm, setLabForm] = useState({ name: '', code: '', capacity: 30, status: 'active' as LabStatus });
  const [labErrors, setLabErrors] = useState<Record<string, string>>({});

  // Computer modal
  const [computerModalOpen, setComputerModalOpen] = useState(false);
  const [computerTargetLabId, setComputerTargetLabId] = useState<string>('');
  const [computerForm, setComputerForm] = useState({
    name: '', assetId: '', os: osOptions[0], ipAddress: '', status: 'active' as ComputerStatus, shieldEnabled: false,
  });
  const [computerErrors, setComputerErrors] = useState<Record<string, string>>({});

  // Delete lab confirmation
  const [deleteLabId, setDeleteLabId] = useState<string | null>(null);

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleLab = (id: string) => {
    setExpandedLabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const buildingComputers = (buildingId: string): ID[] => {
    const labIds = labs.filter((l) => l.buildingId === buildingId).map((l) => l.id);
    return computers.filter((c) => labIds.includes(c.labId)).map((c) => c.id);
  };

  const labComputers = (labId: string): ID[] => computers.filter((c) => c.labId === labId).map((c) => c.id);

  const toggleSelectComputer = (id: ID) => {
    setSelectedComputers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedComputers(new Set(computers.map((c) => c.id)));
  const deselectAll = () => setSelectedComputers(new Set());

  const toggleSelectLab = (labId: string) => {
    const ids = labComputers(labId);
    setSelectedComputers((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelectBuilding = (buildingId: string) => {
    const ids = buildingComputers(buildingId);
    setSelectedComputers((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkShield = (enable: boolean) => {
    const ids = Array.from(selectedComputers);
    if (ids.length === 0) return;
    if (settings.security.shieldConfirmation) {
      setConfirmAction({ enable, count: ids.length, ids });
    } else {
      setShield(ids, enable);
      setSelectedComputers(new Set());
    }
  };

  const confirmShield = () => {
    if (confirmAction) {
      setShield(confirmAction.ids, confirmAction.enable);
      setSelectedComputers(new Set());
    }
  };

  const protectedCount = computers.filter((c) => c.shieldEnabled).length;
  const totalCount = computers.length;
  const protectionPct = totalCount > 0 ? Math.round((protectedCount / totalCount) * 100) : 0;

  const sortedBuildings = useMemo(() => [...buildings].sort((a, b) => a.name.localeCompare(b.name)), [buildings]);

  // ---- Building modal handlers ----
  const openBuildingModal = () => {
    setBuildingForm({ name: '', code: '', location: '', description: '', status: 'active' });
    setBuildingErrors({});
    setBuildingModalOpen(true);
  };

  const validateBuilding = () => {
    const e: Record<string, string> = {};
    if (!buildingForm.name.trim()) e.name = 'Name is required';
    if (!buildingForm.code.trim()) e.code = 'Code is required';
    if (!buildingForm.location.trim()) e.location = 'Location is required';
    setBuildingErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateBuilding = (e: FormEvent) => {
    e.preventDefault();
    if (!validateBuilding()) return;
    createBuilding(buildingForm);
    setBuildingModalOpen(false);
  };

  // ---- Lab modal handlers ----
  const openLabModal = (buildingId: string) => {
    setLabTargetBuildingId(buildingId);
    setLabForm({ name: '', code: '', capacity: 30, status: 'active' });
    setLabErrors({});
    setLabModalOpen(true);
  };

  const validateLab = () => {
    const e: Record<string, string> = {};
    if (!labForm.name.trim()) e.name = 'Name is required';
    if (!labForm.code.trim()) e.code = 'Code is required';
    if (labForm.capacity < 1) e.capacity = 'Capacity must be at least 1';
    setLabErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateLab = (e: FormEvent) => {
    e.preventDefault();
    if (!validateLab()) return;
    createLab({ ...labForm, buildingId: labTargetBuildingId });
    setLabModalOpen(false);
  };

  const handleDeleteLab = () => {
    if (deleteLabId) {
      deleteLab(deleteLabId);
      setExpandedLabs((prev) => {
        const next = new Set(prev);
        next.delete(deleteLabId);
        return next;
      });
    }
  };

  // ---- Computer modal handlers ----
  const openComputerModal = (labId: string) => {
    setComputerTargetLabId(labId);
    setComputerForm({ name: '', assetId: '', os: osOptions[0], ipAddress: '', status: 'active', shieldEnabled: false });
    setComputerErrors({});
    setComputerModalOpen(true);
  };

  const validateComputer = () => {
    const e: Record<string, string> = {};
    if (!computerForm.name.trim()) e.name = 'Computer name is required';
    if (!computerForm.assetId.trim()) e.assetId = 'Asset ID is required';
    if (!computerForm.ipAddress.trim()) e.ipAddress = 'IP address is required';
    setComputerErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateComputer = (e: FormEvent) => {
    e.preventDefault();
    if (!validateComputer()) return;
    createComputer({ ...computerForm, labId: computerTargetLabId });
    setComputerModalOpen(false);
  };

  return (
    <div className="page-container">
      <PageHeader title="EXAM SHIELD" description="Manage and monitor exam protection across all computers.">
        <Button onClick={openBuildingModal}><Plus size={16} /> Add Building</Button>
      </PageHeader>

      {/* Overview */}
      <div className="shield-overview-row">
        <GlassCard className="shield-overview-card">
          <div className="shield-overview-circle">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--accent-light)" strokeWidth="3" />
              <circle
                cx="70" cy="70" r="60" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(protectionPct / 100) * 377} 377`}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="shield-overview-center">
              <span className="shield-overview-pct">{protectionPct}%</span>
              <span className="shield-overview-label">Protected</span>
            </div>
          </div>
          <div className="shield-overview-stats">
            <div className="shield-overview-stat">
              <ShieldStatus status="protected" size="sm" />
              <span className="shield-overview-stat-val">{protectedCount}</span>
              <span className="shield-overview-stat-label">Protected</span>
            </div>
            <div className="shield-overview-stat">
              <ShieldStatus status="partially" size="sm" />
              <span className="shield-overview-stat-val">{totalCount - protectedCount}</span>
              <span className="shield-overview-stat-label">Unprotected</span>
            </div>
            <div className="shield-overview-stat">
              <span className="shield-overview-stat-val">{totalCount}</span>
              <span className="shield-overview-stat-label">Total Computers</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="shield-summary-card">
          <h3 className="card-title">Protection Summary</h3>
          <div className="shield-summary-list">
            {sortedBuildings.map((b) => {
              const status = computeBuildingShield(b.id, labs, computers);
              const bComputers = buildingComputers(b.id);
              const bProtected = bComputers.filter((id) => computers.find((c) => c.id === id)?.shieldEnabled).length;
              return (
                <div key={b.id} className="shield-summary-item">
                  <span className="shield-summary-name">{b.name}</span>
                  <span className="shield-summary-count">{bProtected}/{bComputers.length}</span>
                  <ShieldStatus status={status} size="sm" />
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Hierarchy */}
      <div className="shield-hierarchy">
        <div className="shield-hierarchy-header">
          <div className="shield-selection-controls">
            <Button variant="secondary" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="secondary" size="sm" onClick={deselectAll}>Deselect All</Button>
          </div>
        </div>

        {sortedBuildings.map((building) => {
          const buildingStatus = computeBuildingShield(building.id, labs, computers);
          const bComputerIds = buildingComputers(building.id);
          const allBuildingSelected = bComputerIds.length > 0 && bComputerIds.every((id) => selectedComputers.has(id));
          const isExpanded = expandedBuildings.has(building.id);
          const buildingLabs = labs.filter((l) => l.buildingId === building.id).sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={building.id} className="shield-building">
              <div className="shield-building-row" onClick={() => toggleBuilding(building.id)}>
                <button className="shield-chevron" onClick={(e) => { e.stopPropagation(); toggleBuilding(building.id); }}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <button
                  className={`shield-checkbox ${allBuildingSelected ? 'checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSelectBuilding(building.id); }}
                  aria-label="Select building"
                >
                  {allBuildingSelected && <Check size={14} />}
                </button>
                <span className="shield-building-name">{building.name}</span>
                <span className="shield-building-meta">{buildingLabs.length} labs · {bComputerIds.length} computers</span>
                <div className="shield-building-status"><ShieldStatus status={buildingStatus} size="sm" /></div>
              </div>

              {isExpanded && (
                <div className="shield-labs">
                  {buildingLabs.map((lab) => {
                    const labStatus = computeLabShield(lab.id, computers);
                    const lComputerIds = labComputers(lab.id);
                    const allLabSelected = lComputerIds.length > 0 && lComputerIds.every((id) => selectedComputers.has(id));
                    const labExpanded = expandedLabs.has(lab.id);
                    const labComputersList = computers.filter((c) => c.labId === lab.id);

                    return (
                      <div key={lab.id} className="shield-lab">
                        <div className="shield-lab-row" onClick={() => toggleLab(lab.id)}>
                          <button className="shield-chevron small" onClick={(e) => { e.stopPropagation(); toggleLab(lab.id); }}>
                            {labExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <button
                            className={`shield-checkbox ${allLabSelected ? 'checked' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleSelectLab(lab.id); }}
                            aria-label="Select lab"
                          >
                            {allLabSelected && <Check size={14} />}
                          </button>
                          <span className="shield-lab-name">{lab.name}</span>
                          <span className="shield-lab-meta">{lComputerIds.length} computers</span>
                          <div className="shield-lab-status"><ShieldStatus status={labStatus} size="sm" /></div>
                          <button
                            className="shield-add-btn"
                            onClick={(e) => { e.stopPropagation(); openComputerModal(lab.id); }}
                            aria-label="Add computer to lab"
                            title="Add Computer"
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            className="shield-delete-btn"
                            onClick={(e) => { e.stopPropagation(); setDeleteLabId(lab.id); }}
                            aria-label="Remove lab"
                            title="Remove Lab"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {labExpanded && (
                          <div className="shield-computers">
                            {labComputersList.map((c) => (
                              <div key={c.id} className="shield-computer-row">
                                <button
                                  className={`shield-checkbox ${selectedComputers.has(c.id) ? 'checked' : ''}`}
                                  onClick={() => toggleSelectComputer(c.id)}
                                  aria-label="Select computer"
                                >
                                  {selectedComputers.has(c.id) && <Check size={14} />}
                                </button>
                                <span className="shield-computer-name">{c.name}</span>
                                <span className="shield-computer-asset">{c.assetId}</span>
                                <span className="shield-computer-ip">{c.ipAddress}</span>
                                <ShieldStatus status={c.shieldEnabled ? 'protected' : 'unprotected'} size="sm" />
                                <button
                                  className="shield-toggle-btn"
                                  onClick={() => {
                                    if (settings.security.shieldConfirmation) {
                                      setConfirmAction({ enable: !c.shieldEnabled, count: 1, ids: [c.id] });
                                    } else {
                                      setShield([c.id], !c.shieldEnabled);
                                    }
                                  }}
                                >
                                  {c.shieldEnabled ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                                </button>
                              </div>
                            ))}
                            {labComputersList.length === 0 && (
                              <div className="shield-empty-lab">No computers in this lab</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {buildingLabs.length === 0 && <div className="shield-empty-lab">No labs in this building</div>}
                  <button className="shield-add-lab-btn" onClick={() => openLabModal(building.id)}>
                    <Plus size={15} /> Add Lab
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating bulk action bar */}
      {selectedComputers.size > 0 && (
        <div className="bulk-action-bar glass">
          <span className="bulk-action-count">{selectedComputers.size} selected</span>
          <div className="bulk-action-buttons">
            <Button size="sm" onClick={() => handleBulkShield(true)}>
              <ShieldCheck size={15} /> Enable Shield
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleBulkShield(false)}>
              <ShieldOff size={15} /> Disable Shield
            </Button>
            <Button size="sm" variant="secondary" onClick={deselectAll}>Clear</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmShield}
        title={confirmAction?.enable ? 'Enable Exam Shield?' : 'Disable Exam Shield?'}
        message={
          confirmAction
            ? `You are about to ${confirmAction.enable ? 'enable' : 'disable'} protection for ${confirmAction.count} computer${confirmAction.count !== 1 ? 's' : ''}. This action will be recorded in the audit log.`
            : ''
        }
        confirmLabel={confirmAction?.enable ? 'Enable Shield' : 'Disable Shield'}
        danger={!confirmAction?.enable}
      />

      <ConfirmDialog
        open={deleteLabId !== null}
        onClose={() => setDeleteLabId(null)}
        onConfirm={handleDeleteLab}
        title="Remove Lab?"
        message="This will also remove all computers within this lab. This action cannot be undone."
        confirmLabel="Remove"
      />

      {/* Add Building Modal */}
      <Modal
        open={buildingModalOpen}
        onClose={() => setBuildingModalOpen(false)}
        title="Add Building"
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setBuildingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBuilding as unknown as () => void} type="submit">Create Building</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateBuilding} className="form-stack">
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" value={buildingForm.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, name: e.target.value })} placeholder="Engineering Block" />
            {buildingErrors.name && <span className="form-error">{buildingErrors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Code</label>
              <input className="form-input" value={buildingForm.code} onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })} placeholder="ENG" maxLength={6} />
              {buildingErrors.code && <span className="form-error">{buildingErrors.code}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" value={buildingForm.location} onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, location: e.target.value })} placeholder="North Campus" />
              {buildingErrors.location && <span className="form-error">{buildingErrors.location}</span>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={buildingForm.description} onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })} placeholder="Brief description of the building..." rows={3} />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={buildingForm.status} onChange={(e) => setBuildingForm({ ...buildingForm, status: e.target.value as BuildingStatus })}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Add Lab Modal */}
      <Modal
        open={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        title="Add Lab"
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setLabModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLab as unknown as () => void} type="submit">Create Lab</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLab} className="form-stack">
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" value={labForm.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setLabForm({ ...labForm, name: e.target.value })} placeholder="Computer Lab 01" />
            {labErrors.name && <span className="form-error">{labErrors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Code</label>
              <input className="form-input" value={labForm.code} onChange={(e: ChangeEvent<HTMLInputElement>) => setLabForm({ ...labForm, code: e.target.value.toUpperCase() })} placeholder="CL01" maxLength={6} />
              {labErrors.code && <span className="form-error">{labErrors.code}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Capacity</label>
              <input type="number" className="form-input" value={labForm.capacity} onChange={(e: ChangeEvent<HTMLInputElement>) => setLabForm({ ...labForm, capacity: Number(e.target.value) })} min={1} />
              {labErrors.capacity && <span className="form-error">{labErrors.capacity}</span>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={labForm.status} onChange={(e) => setLabForm({ ...labForm, status: e.target.value as LabStatus })}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Add Computer Modal */}
      <Modal
        open={computerModalOpen}
        onClose={() => setComputerModalOpen(false)}
        title="Add Computer"
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setComputerModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateComputer as unknown as () => void} type="submit">Create Computer</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateComputer} className="form-stack">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Computer Name</label>
              <input className="form-input" value={computerForm.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setComputerForm({ ...computerForm, name: e.target.value })} placeholder="PC-001" />
              {computerErrors.name && <span className="form-error">{computerErrors.name}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Asset ID</label>
              <input className="form-input" value={computerForm.assetId} onChange={(e: ChangeEvent<HTMLInputElement>) => setComputerForm({ ...computerForm, assetId: e.target.value })} placeholder="AST-0001" />
              {computerErrors.assetId && <span className="form-error">{computerErrors.assetId}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Operating System</label>
              <select className="form-select" value={computerForm.os} onChange={(e) => setComputerForm({ ...computerForm, os: e.target.value })}>
                {osOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">IP Address</label>
              <input className="form-input" value={computerForm.ipAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setComputerForm({ ...computerForm, ipAddress: e.target.value })} placeholder="10.1.1.10" />
              {computerErrors.ipAddress && <span className="form-error">{computerErrors.ipAddress}</span>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={computerForm.status} onChange={(e) => setComputerForm({ ...computerForm, status: e.target.value as ComputerStatus })}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="form-field">
            <label className="checkbox-label">
              <input type="checkbox" checked={computerForm.shieldEnabled} onChange={(e) => setComputerForm({ ...computerForm, shieldEnabled: e.target.checked })} />
              <span className="checkbox-custom" />
              Enable Exam Shield
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
