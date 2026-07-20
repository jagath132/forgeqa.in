import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export function UserDropdown() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const profileName = useAppStore((s) => s.profileName);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nextest_picture');
    if (saved) setAvatarUrl(saved);
    const handleStorage = () => {
      const saved = localStorage.getItem('nextest_picture');
      if (saved) setAvatarUrl(saved);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function getInitials(email: string) {
    if (!email) return 'U';
    const part = email.split('@')[0];
    return part.length <= 2 ? part.toUpperCase() : part.substring(0, 2).toUpperCase();
  }

  function handleLogout() {
    setOpen(false);
    openConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      () => {
        logout();
        navigate('/');
      },
      'Sign Out'
    );
  }

  if (!user) return null;

  const displayName = profileName || user.email.split('@')[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer"
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover ring-2"
            style={{}}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {getInitials(displayName)}
          </div>
        )}
        <span
          className="hidden lg:block text-sm max-w-[120px] truncate"
          style={{ color: 'var(--color-text)' }}
        >
          {displayName}
        </span>
        <svg
          className="hidden lg:block h-3.5 w-3.5"
          style={{
            color: 'var(--color-text-muted)',
            transition: 'transform 150ms ease-out',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-lg animate-fade-in z-50 overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px rgba(30, 41, 59, 0.1), 0 4px 12px rgba(30, 41, 59, 0.06)',
          }}
        >
          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-muted)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {displayName}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-muted-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              Settings
            </button>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/admin');
              }}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-muted-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z"
                />
              </svg>
              License & Admin Manager
            </button>
          </div>
          <div className="border-t py-1" style={{ borderColor: 'var(--color-muted)' }}>
            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-danger-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
