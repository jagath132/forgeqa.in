export function ConfirmDialog({
  open, title, message, confirmLabel = "Yes, Delete", onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-6 animate-fade-in">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--danger-soft)" }}>
          <svg className="h-6 w-6" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 id="confirm-dialog-title" className="text-center text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-sm font-semibold">Cancel</button>
          <button type="button" onClick={onConfirm} className="btn-danger flex-1 py-2.5 text-sm font-semibold">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
