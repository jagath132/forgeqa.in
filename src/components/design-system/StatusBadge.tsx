import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'cyan'
  | 'violet';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; dot: string }
> = {
  default: {
    bg: 'var(--bg-tertiary)',
    text: 'var(--text-secondary)',
    border: 'var(--border-subtle)',
    dot: 'var(--text-muted)',
  },
  primary: {
    bg: 'var(--color-accent-soft)',
    text: 'var(--color-accent)',
    border: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
    dot: 'var(--color-accent)',
  },
  success: {
    bg: 'var(--color-emerald-soft)',
    text: 'var(--color-emerald)',
    border: 'color-mix(in srgb, var(--color-emerald) 25%, transparent)',
    dot: 'var(--color-emerald)',
  },
  warning: {
    bg: 'var(--color-amber-soft)',
    text: 'var(--color-amber)',
    border: 'color-mix(in srgb, var(--color-amber) 25%, transparent)',
    dot: 'var(--color-amber)',
  },
  danger: {
    bg: 'var(--color-danger-soft)',
    text: 'var(--color-danger)',
    border: 'color-mix(in srgb, var(--color-danger) 25%, transparent)',
    dot: 'var(--color-danger)',
  },
  cyan: {
    bg: 'var(--color-cyan-soft)',
    text: 'var(--color-cyan)',
    border: 'color-mix(in srgb, var(--color-cyan) 25%, transparent)',
    dot: 'var(--color-cyan)',
  },
  violet: {
    bg: 'var(--color-violet-soft)',
    text: 'var(--color-violet)',
    border: 'color-mix(in srgb, var(--color-violet) 25%, transparent)',
    dot: 'var(--color-violet)',
  },
};

export function StatusBadge({
  label,
  variant = 'default',
  size = 'sm',
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  const styles = variantStyles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono tracking-wide ${sizeClasses} ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
      }}
    >
      {pulse && (
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: styles.dot }}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
