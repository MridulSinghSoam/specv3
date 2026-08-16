import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'gray';
  dot?: boolean;
}

export function Badge({ children, variant = 'default', dot = false }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
