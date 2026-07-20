export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes, Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(6px)' }}
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm animate-fade-in"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 16px 48px rgba(30, 41, 59, 0.12), 0 4px 16px rgba(30, 41, 59, 0.08)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-danger-soft)' }}
        >
          <svg
            className="h-7 w-7"
            style={{ color: 'var(--color-danger)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-center text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        <p
          className="mt-2 text-center text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {message}
        </p>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-muted-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)';
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: 'var(--color-danger)',
              color: 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-danger)';
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
