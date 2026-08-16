import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/StatCard';
import { ShieldStatus } from '@/components/ui/ShieldStatus';
import { Building2, Server, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ShieldStatus as ShieldStatusType } from '@/types';

export function DashboardPage() {
  const { buildings, labs, computers, alerts, loading } = useApp();

  const activeBuildings = buildings.filter((b) => b.status === 'active').length;
  const activeLabs = labs.filter((l) => l.status === 'active').length;
  const protectedComputers = computers.filter((c) => c.shieldEnabled).length;
  const openAlerts = alerts.filter((a) => a.status === 'open' || a.status === 'investigating').length;

  const totalComputers = computers.length;
  const protectedCount = computers.filter((c) => c.shieldEnabled).length;
  const protectionPct = totalComputers > 0 ? Math.round((protectedCount / totalComputers) * 100) : 0;

  const buildingShield: ShieldStatusType =
    protectedCount === totalComputers && totalComputers > 0
      ? 'protected'
      : protectedCount > 0
      ? 'partially'
      : 'unprotected';

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-grid" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-label">CAMPUS SECURITY</div>
          <h1 className="dashboard-hero-title">
            INFRASTRUCTURE<br />
            <span className="dashboard-hero-title-accent">& EXAM SHIELD</span>
          </h1>
          <p className="dashboard-hero-subtitle">
            Monitor buildings, laboratories, computers, and examination security
            from one centralized control center.
          </p>
          <div className="dashboard-hero-shield">
            <ShieldStatus status={buildingShield} size="lg" />
          </div>
        </div>
        <div className="dashboard-hero-visual">
          <div className="hero-circle-ring">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--accent-light)" strokeWidth="2" />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(protectionPct / 100) * 553} 553`}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="hero-circle-center">
              <span className="hero-circle-pct">{protectionPct}%</span>
              <span className="hero-circle-label">Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard label="Active Buildings" value={activeBuildings} sublabel="Across campus" icon={Building2} accent="amber" />
        <StatCard label="Active Labs" value={activeLabs} sublabel="In operation" icon={Server} accent="amber" />
        <StatCard label="Protected Computers" value={protectedComputers} sublabel={`of ${totalComputers} total`} icon={ShieldCheck} accent="green" />
        <StatCard label="Open Alerts" value={openAlerts} sublabel="Needs attention" icon={AlertTriangle} accent={openAlerts > 0 ? 'red' : 'amber'} />
      </div>
    </div>
  );
}
