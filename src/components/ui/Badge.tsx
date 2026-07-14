import type { PropsWithChildren } from 'react';

const variantStyles: Record<string, { bg: string; color: string; border: string }> = {
  neutral: {
    bg: 'var(--color-muted)',
    color: 'var(--color-text-secondary)',
    border: 'transparent',
  },
  primary: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent)', border: 'transparent' },
  success: {
    bg: 'var(--color-success-soft)',
    color: 'var(--color-success)',
    border: 'transparent',
  },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-warning)', border: 'transparent' },
  danger: { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)', border: 'transparent' },
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: PropsWithChildren<{ variant?: keyof typeof variantStyles; className?: string }>) {
  const s = variantStyles[variant] ?? variantStyles.neutral;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: '1.4',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  );
}
