import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: 'blue' | 'green' | 'amber' | 'red';
}

export function StatCard({ label, value, sublabel, icon: Icon, accent = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <span className="stat-card-icon">
            <Icon size={20} />
          </span>
        )}
      </div>
      <div className="stat-card-value">{typeof value === 'number' ? String(value).padStart(2, '0') : value}</div>
      {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
    </div>
  );
}
