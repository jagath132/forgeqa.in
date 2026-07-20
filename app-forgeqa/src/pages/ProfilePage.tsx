import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, getProviderLabel } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import {
  api,
  getProfile,
  saveProfile,
  getProductKey,
  setup2FA,
  enable2FA,
  disable2FA,
  getTrustedDevices,
  removeTrustedDevice,
  removeAllTrustedDevices,
  type TrustedDevice,
} from '../lib/api';

const styles = `
  @keyframes logoutShine {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .logout-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
  }
  .logout-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, transparent 100%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.4);
    transform: scale(1.04);
    box-shadow: 0 0 28px rgba(239, 68, 68, 0.2), 0 8px 32px rgba(0,0,0,0.15);
  }
  .logout-btn:hover::before {
    opacity: 1;
    animation: logoutShine 1.2s linear infinite;
  }
  .logout-btn:hover .logout-icon {
    transform: translateX(3px) translateY(-2px);
    filter: drop-shadow(0 0 4px rgba(239,68,68,0.5));
  }
  .logout-btn:hover .logout-label {
    letter-spacing: 0.08em;
    text-shadow: 0 0 8px rgba(239,68,68,0.3);
  }
`;

function getInitials(name: string, fallback = 'U') {
  if (!name) return fallback;
  return name.substring(0, 2).toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const provider = useAppStore((s) => s.provider);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const profileName = useAppStore((s) => s.profileName);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const setProfileName = useAppStore((s) => s.setProfileName);

  const [localName, setLocalName] = useState(profileName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [productKey, setProductKey] = useState<{ key: string; activatedAt: string } | null>(null);
  const [supportSent, setSupportSent] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: '', message: '' });

  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{
    secret: string;
    uri: string;
    qrCode: string;
  } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'verify' | 'enabled'>('idle');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);

  useEffect(() => {
    if (!supportSent) return;
    const timer = setTimeout(() => {
      setSupportSent(false);
      setSupportForm({ name: '', email: '', subject: '', message: '' });
    }, 10000);
    return () => clearTimeout(timer);
  }, [supportSent]);

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '62dd773d-d156-48a6-baa0-8264963687ee',
          ...supportForm,
        }),
      });
      setSupportSent(true);
    } catch {
      setSupportSent(true);
    }
  }

  useEffect(() => {
    if (!user) return;
    getProfile().then((profile) => {
      if (profile.displayName) {
        setProfileName(profile.displayName);
        setLocalName(profile.displayName);
      }
    });
    getProductKey().then(setProductKey);
    check2FAStatus();
  }, [user, setProfileName]);

  async function check2FAStatus() {
    try {
      const res = await api.get<{ user: { twoFactorEnabled: boolean } }>('/api/auth/me');
      const enabled = res.data.user?.twoFactorEnabled || false;
      setTwoFAEnabled(enabled);
      setTwoFAStep(enabled ? 'enabled' : 'idle');
      if (enabled) {
        loadTrustedDevices();
      }
    } catch {
      // ignore
    }
  }

  async function loadTrustedDevices() {
    try {
      const devices = await getTrustedDevices();
      setTrustedDevices(devices);
    } catch {
      // ignore
    }
  }

  async function handleSetup2FA() {
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      const result = await setup2FA();
      setTwoFASetup(result);
      setTwoFAStep('setup');
    } catch (err: any) {
      setTwoFAError(err.response?.data?.error || 'Failed to setup 2FA');
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleEnable2FA() {
    if (twoFAToken.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      await enable2FA(twoFAToken);
      setTwoFAEnabled(true);
      setTwoFAStep('enabled');
      setTwoFAToken('');
      loadTrustedDevices();
    } catch (err: any) {
      setTwoFAError(err.response?.data?.error || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleDisable2FA() {
    if (twoFAToken.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      await disable2FA(twoFAToken);
      setTwoFAEnabled(false);
      setTwoFAStep('idle');
      setTwoFAToken('');
      setTrustedDevices([]);
    } catch (err: any) {
      setTwoFAError(err.response?.data?.error || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleRemoveDevice(deviceId: string) {
    try {
      await removeTrustedDevice(deviceId);
      setTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {
      // ignore
    }
  }

  async function handleRemoveAllDevices() {
    try {
      await removeAllTrustedDevices();
      setTrustedDevices([]);
    } catch {
      // ignore
    }
  }

  function handleSaveName() {
    const name = localName.trim();
    if (!name) return;
    setNameSaving(true);
    saveProfile(name)
      .then(() => {
        setProfileName(name);
        setLocalName('');
        setNameSaving(false);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      })
      .catch(() => {
        setLocalName(profileName);
        setNameSaving(false);
      });
  }

  function handleLogout() {
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

  const providerHasKey = provider ? savedProviderKeys[provider] === true : false;

  if (!user) return null;

  const initials = getInitials(profileName || user.email.split('@')[0]);
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <style>{styles}</style>

      {/* ── Profile Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.08)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.05)', transform: 'translate(-20%, 20%)' }}
        />
        <div className="relative px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="shrink-0">
            <div className="relative">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
                  backdropFilter: 'blur(12px)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {initials}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2"
                style={{ borderColor: 'var(--accent)' }}
              >
                <svg
                  className="w-full h-full p-1 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-left text-white min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm truncate">
              {profileName || 'Your Account'}
            </h1>
            <p className="text-sm opacity-90 mt-1">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs opacity-75">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                Member since {joined}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            className="logout-btn shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <svg
              className="logout-icon w-4 h-4 transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="logout-label transition-all duration-300">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Product Key ── */}
      {productKey ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent-emerald-soft), transparent)',
              }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--accent-emerald)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Product Key
                </p>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: 'var(--accent-emerald-soft)',
                    color: 'var(--accent-emerald)',
                  }}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Active
                </span>
              </div>
              <p
                className="text-xs mt-1 font-mono tracking-[0.15em]"
                style={{ color: 'var(--text-muted)' }}
              >
                {productKey.key}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Activated {new Date(productKey.activatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Product Key
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                No product key associated with this account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Grid ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Display Name */}
        <Card className="flex flex-col">
          <div
            className="flex items-center gap-3 pb-4 mb-4 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--accent-soft)' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--accent)' }}
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
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Display Name
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                How others see you in the workspace.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <input
              className="input-modern flex-1 px-4 py-2.5 text-sm"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter your display name"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button
              onClick={handleSaveName}
              disabled={nameSaving}
              className="btn-primary px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {nameSaving ? 'Saving...' : nameSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </Card>

        {/* AI Provider Status — replaces Change Password */}
        <Card className="md:col-span-2">
          <div
            className="flex items-center gap-3 pb-4 mb-4 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: provider ? 'var(--accent-violet-soft)' : 'var(--bg-tertiary)' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: provider ? 'var(--accent-violet)' : 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="12" r="7" />
                <path d="M12 5v14M5 12h14" opacity="0.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                AI Provider
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Active provider used for test generation.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-between rounded-xl p-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: provider ? 'var(--accent-soft)' : 'var(--bg-card)' }}
              >
                {provider ? (
                  <svg
                    className="h-4 w-4"
                    style={{ color: 'var(--accent)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="7" />
                    <path d="M12 5v14M5 12h14" opacity="0.5" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    style={{ color: 'var(--text-muted)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {provider ? getProviderLabel(provider) : 'Not configured'}
                </p>
                {provider && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: providerHasKey ? 'var(--accent-emerald)' : 'var(--warning)' }}
                  >
                    {providerHasKey ? 'API key saved' : 'No API key configured'}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/ai-settings')}
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              }}
            >
              {provider ? 'Change Provider' : 'Configure'}
            </button>
          </div>
        </Card>
      </div>

      {/* ── Two-Factor Authentication ── */}
      <Card>
        <div
          className="flex items-center gap-3 pb-4 mb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: twoFAEnabled ? 'var(--accent-emerald-soft)' : 'var(--bg-tertiary)',
            }}
          >
            <svg
              className="h-5 w-5"
              style={{ color: twoFAEnabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Two-Factor Authentication
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add an extra layer of security to your account.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: twoFAEnabled ? 'var(--accent-emerald-soft)' : 'var(--bg-tertiary)',
              color: twoFAEnabled ? 'var(--accent-emerald)' : 'var(--text-muted)',
            }}
          >
            {twoFAEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* 2FA Disabled - Setup */}
        {twoFAStep === 'idle' && (
          <div className="text-center py-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Protect your account with an authenticator app like Google Authenticator or Authy.
            </p>
            <button
              onClick={handleSetup2FA}
              disabled={twoFALoading}
              type="button"
              className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--color-surface)' }}
            >
              {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {/* 2FA Setup - Show QR Code */}
        {twoFAStep === 'setup' && twoFASetup && (
          <div className="py-6">
            <div className="text-center mb-6">
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Scan QR Code
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Scan this QR code with your authenticator app.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '2px solid var(--border-default)',
                }}
              >
                <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <div className="w-full max-w-sm">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Or enter this code manually:
                </p>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <code
                    className="flex-1 text-xs font-mono break-all"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {twoFASetup.secret}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(twoFASetup.secret)}
                    type="button"
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="w-full max-w-sm">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Enter the 6-digit code from your app:
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl outline-none transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `2px solid ${twoFAToken.length === 6 ? 'var(--accent-emerald)' : 'var(--border-default)'}`,
                    color: 'var(--text-primary)',
                  }}
                />
                {twoFAError && (
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--danger)' }}>
                    {twoFAError}
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setTwoFAStep('idle');
                      setTwoFASetup(null);
                      setTwoFAToken('');
                      setTwoFAError('');
                    }}
                    type="button"
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl cursor-pointer"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnable2FA}
                    disabled={twoFAToken.length !== 6 || twoFALoading}
                    type="button"
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'var(--color-surface)' }}
                  >
                    {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Enabled - Management */}
        {twoFAStep === 'enabled' && (
          <div className="py-4">
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                background: 'var(--accent-emerald-soft)',
                border: '1px solid color-mix(in srgb, var(--accent-emerald) 20%, transparent)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  style={{ color: 'var(--accent-emerald)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--accent-emerald)' }}>
                  Two-factor authentication is enabled
                </span>
              </div>
            </div>

            {/* Disable 2FA */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Disable 2FA
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Enter your current authenticator code to disable 2FA.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 py-2.5 text-center text-lg tracking-[0.3em] font-mono rounded-xl outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleDisable2FA}
                  disabled={twoFAToken.length !== 6 || twoFALoading}
                  type="button"
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {twoFALoading ? 'Disabling...' : 'Disable'}
                </button>
              </div>
              {twoFAError && (
                <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
                  {twoFAError}
                </p>
              )}
            </div>

            {/* Trusted Devices */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Trusted Devices
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Devices that skip 2FA for 30 days.
                  </p>
                </div>
                {trustedDevices.length > 0 && (
                  <button
                    onClick={handleRemoveAllDevices}
                    type="button"
                    className="text-xs font-semibold cursor-pointer"
                    style={{ color: 'var(--danger)' }}
                  >
                    Remove All
                  </button>
                )}
              </div>
              {trustedDevices.length === 0 ? (
                <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  No trusted devices.
                </p>
              ) : (
                <div className="space-y-2">
                  {trustedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-4 w-4"
                          style={{
                            color: device.isExpired ? 'var(--text-muted)' : 'var(--accent-emerald)',
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.41A2.25 2.25 0 012.25 5.495V5.25"
                          />
                        </svg>
                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {device.deviceName}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {device.isExpired
                              ? 'Expired'
                              : `Expires ${new Date(device.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        type="button"
                        className="text-xs font-semibold cursor-pointer"
                        style={{ color: 'var(--danger)' }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Support */}
      <section>
        <div className="text-center mb-10">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            }}
          >
            Get Help
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Contact Support
          </h2>
          <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Have a question or issue? We are here to help.
          </p>
        </div>

        {supportSent ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5"
              style={{ background: 'var(--accent-soft)' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: 'var(--accent)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Message Sent!
            </h3>
            <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Thank you for reaching out. Our team will get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSupportSubmit}
            className="rounded-2xl p-8 sm:p-10 space-y-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="support-name"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Name
                </label>
                <input
                  id="support-name"
                  type="text"
                  required
                  value={supportForm.name}
                  onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="support-email"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={supportForm.email}
                  onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="support-subject"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Subject
              </label>
              <input
                id="support-subject"
                type="text"
                required
                value={supportForm.subject}
                onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="How can we help?"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="support-message"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Message
              </label>
              <textarea
                id="support-message"
                required
                rows={4}
                value={supportForm.message}
                onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-y"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'var(--color-surface)' }}
            >
              Send Message
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
