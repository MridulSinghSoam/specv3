import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ShieldStatus } from '@/components/ui/ShieldStatus';
import { Building2, Server, Computer as ComputerIcon, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

export function InfrastructurePage() {
  const { buildings, labs, computers } = useApp();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(buildings.map((b) => b.id)));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const labComputers = (labId: string) => computers.filter((c) => c.labId === labId);
  const buildingLabs = (buildingId: string) => labs.filter((l) => l.buildingId === buildingId);
  const buildingComputers = (buildingId: string) => {
    const labIds = buildingLabs(buildingId).map((l) => l.id);
    return computers.filter((c) => labIds.includes(c.labId));
  };

  return (
    <div className="page-container">
      <PageHeader title="INFRASTRUCTURE" description="Manage buildings, labs, and computers across campus." />

      <div className="infra-nav-cards">
        <GlassCard className="infra-nav-card" onClick={() => navigate('/infrastructure/buildings')}>
          <div className="infra-nav-icon"><Building2 size={24} /></div>
          <div className="infra-nav-info">
            <span className="infra-nav-count">{buildings.length}</span>
            <span className="infra-nav-label">Buildings</span>
          </div>
          <ArrowRight size={18} className="infra-nav-arrow" />
        </GlassCard>
        <GlassCard className="infra-nav-card" onClick={() => navigate('/infrastructure/labs')}>
          <div className="infra-nav-icon"><Server size={24} /></div>
          <div className="infra-nav-info">
            <span className="infra-nav-count">{labs.length}</span>
            <span className="infra-nav-label">Labs</span>
          </div>
          <ArrowRight size={18} className="infra-nav-arrow" />
        </GlassCard>
        <GlassCard className="infra-nav-card" onClick={() => navigate('/infrastructure/computers')}>
          <div className="infra-nav-icon"><ComputerIcon size={24} /></div>
          <div className="infra-nav-info">
            <span className="infra-nav-count">{computers.length}</span>
            <span className="infra-nav-label">Computers</span>
          </div>
          <ArrowRight size={18} className="infra-nav-arrow" />
        </GlassCard>
      </div>

      <div className="infra-hierarchy">
        {buildings.map((building) => {
          const bLabs = buildingLabs(building.id);
          const bComputers = buildingComputers(building.id);
          const protectedCount = bComputers.filter((c) => c.shieldEnabled).length;
          const isExpanded = expanded.has(building.id);

          return (
            <GlassCard key={building.id} className="infra-building-card">
              <div className="infra-building-header" onClick={() => toggle(building.id)}>
                <button className="shield-chevron">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="infra-building-icon"><Building2 size={20} /></div>
                <div className="infra-building-info">
                  <h3 className="infra-building-name">{building.name}</h3>
                  <span className="infra-building-meta">{building.code} · {building.location}</span>
                </div>
                <div className="infra-building-stats">
                  <span>{bLabs.length} labs</span>
                  <span>{bComputers.length} computers</span>
                  <span>{protectedCount} protected</span>
                </div>
                <Badge variant={building.status === 'active' ? 'green' : building.status === 'maintenance' ? 'amber' : 'gray'} dot>
                  {building.status}
                </Badge>
              </div>

              {isExpanded && (
                <div className="infra-labs-list">
                  {bLabs.length === 0 ? (
                    <div className="infra-empty">No labs in this building</div>
                  ) : (
                    bLabs.map((lab) => {
                      const lComputers = labComputers(lab.id);
                      const lProtected = lComputers.filter((c) => c.shieldEnabled).length;
                      return (
                        <div key={lab.id} className="infra-lab-item">
                          <div className="infra-lab-header">
                            <div className="infra-lab-icon"><Server size={16} /></div>
                            <span className="infra-lab-name">{lab.name}</span>
                            <span className="infra-lab-meta">{lComputers.length} computers · {lProtected} protected</span>
                            <ShieldStatus
                              status={lProtected === lComputers.length && lComputers.length > 0 ? 'protected' : lProtected > 0 ? 'partially' : 'unprotected'}
                              size="sm"
                            />
                          </div>
                          {lComputers.length > 0 && (
                            <div className="infra-computers-list">
                              {lComputers.map((c) => (
                                <div key={c.id} className="infra-computer-item">
                                  <ComputerIcon size={14} />
                                  <span className="infra-computer-name">{c.name}</span>
                                  <span className="infra-computer-asset">{c.assetId}</span>
                                  <span className="infra-computer-os">{c.os}</span>
                                  <ShieldStatus status={c.shieldEnabled ? 'protected' : 'unprotected'} size="sm" showLabel={false} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
