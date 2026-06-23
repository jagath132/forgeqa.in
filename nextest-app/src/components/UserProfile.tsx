import { type User } from "../lib/api";
import { useAppStore } from "../store/useAppStore";

interface UserProfileProps {
  user: User;
  onRequestLogout: () => void;
}

export function UserProfile({ user, onRequestLogout }: UserProfileProps) {
  const profileName = useAppStore((s) => s.profileName);
  const displayName = profileName || user.email.split("@")[0];

  const getInitials = (name: string) => {
    if (!name) return "U";
    if (name.length <= 2) return name.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="border-t border-[var(--border-default)] px-5 py-4 mt-auto">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-white text-xs">
          {getInitials(displayName)}
          <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-[var(--success)] ring-2 ring-[var(--bg-card)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]" title={displayName}>
            {displayName}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Active Session</p>
        </div>
        <button
          onClick={onRequestLogout}
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          title="Sign Out"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
