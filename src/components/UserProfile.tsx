import { type User } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { LogOut } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onRequestLogout: () => void;
}

export function UserProfile({ user, onRequestLogout }: UserProfileProps) {
  const profileName = useAppStore((s) => s.profileName);
  const displayName = profileName || user.email.split('@')[0];

  const getInitials = (name: string) => {
    if (!name) return 'U';
    if (name.length <= 2) return name.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 12px 12px', marginTop: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '10px 12px',
          borderRadius: 16,
          transition: 'background 0.2s ease',
          cursor: 'default',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: 'var(--color-surface)',
            flexShrink: 0,
            background: 'var(--gradient-primary)',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
          }}
        >
          {getInitials(displayName)}
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--color-success)',
              border: '2px solid var(--color-surface)',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              lineHeight: '1.2',
            }}
            title={displayName}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginTop: 2,
            }}
          >
            QA Engineer
          </div>
        </div>
        <button
          onClick={onRequestLogout}
          type="button"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          title="Sign Out"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-danger-soft)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
