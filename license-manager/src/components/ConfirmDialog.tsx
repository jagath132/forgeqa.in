import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Promise-based confirmation, drop-in replacement for the native `confirm()`:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "Delete this item?" })) return;
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const stateRef = useRef<ConfirmState | null>(null);
  stateRef.current = state;

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      // Replace any pending dialog — its promise resolves false (treated as cancel).
      setState((prev) => {
        prev?.resolve(false);
        return { danger: true, ...options, resolve };
      });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState((prev) => {
      prev?.resolve(result);
      return null;
    });
  }, []);

  // ESC cancels, Enter confirms — same feel as the native dialog.
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') {
        e.preventDefault();
        close(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && <ConfirmDialog state={state} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState;
  onClose: (result: boolean) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const danger = state.danger !== false;
  const confirmLabel = state.confirmLabel || (danger ? 'Yes, Continue' : 'Confirm');

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 400, alignItems: 'center' }}
      onClick={() => onClose(false)}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="modal"
        style={{ maxWidth: 440, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 8,
                background: danger ? 'var(--color-danger-subtle)' : 'var(--color-accent-subtle)',
                color: danger ? 'var(--color-danger)' : 'var(--color-accent)',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={16} strokeWidth={2.2} />
            </span>
            <h3 id="confirm-dialog-title">{state.title || 'Please confirm'}</h3>
          </div>
          <button className="modal-close" onClick={() => onClose(false)} aria-label="Cancel">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="modal-body">
          <p
            id="confirm-dialog-message"
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            {state.message}
          </p>
        </div>

        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={() => onClose(false)}
          >
            {state.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
