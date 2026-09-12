import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: { text: string; positive?: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
}

export function MetricCard({
  label,
  value,
  sublabel,
  delta,
  icon,
  variant = 'default',
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-2xl font-bold tracking-tight font-display"
              style={{ color: 'var(--text-primary)' }}
            >
              {value}
            </span>
            {delta && (
              <span
                className={`text-xs font-semibold font-mono ${
                  delta.positive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {delta.positive ? '↑' : '↓'} {delta.text}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: variant === 'accent' ? 'var(--color-accent)' : 'var(--text-primary)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
