import React, { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { UsageMeter } from '../components/UsageMeter';
import { SeatSelector } from '../components/SeatSelector';
import { PlanComparison } from '../components/PlanComparison';
import {
  getProfile,
  saveProfile,
  getProductKey,
  api,
  type AiProvider,
  setup2FA,
  enable2FA,
  disable2FA,
  getTrustedDevices,
  removeTrustedDevice,
  removeAllTrustedDevices,
  type TrustedDevice,
} from '../lib/api';

type Section = 'profile' | 'billing' | 'integrations';

const sections: { id: Section; label: string; icon: string }[] = [
  {
    id: 'profile',
    label: 'Profile & Security',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
  },
];

const providerOptions: { id: AiProvider; label: string; description: string }[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini models optimized for structured multi-modal instructions.',
  },
  {
    id: 'openai',
    label: 'OpenAI GPT-4',
    description: 'Industry standard models for multi-scenario QA verification.',
  },
  {
    id: 'groq',
    label: 'Groq LLaMA',
    description: 'Ultra-fast low-latency models for immediate test compilation.',
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    description: 'Claude conversational AI models for highly complex logic.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter Proxy',
    description: 'Access any open source or commercial models from a unified gateway.',
  },
  {
    id: 'opencode',
    label: 'OpenCode Engine',
    description: 'Code-specific developer model proxies for scripting logic.',
  },
];

function getInitials(name: string, fallback = 'U') {
  if (!name) return fallback;
  return name.substring(0, 2).toUpperCase();
}

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAppStore((s: any) => s.user);
  const profileName = useAppStore((s: any) => s.profileName);
  const setProfileName = useAppStore((s: any) => s.setProfileName);
  const openConfirm = useAppStore((s: any) => s.openConfirm);
  const logout = useAppStore((s: any) => s.logout);

  const [activeSection, setActiveSection] = useState<Section>('profile');

  /* ── Profile state ── */
  const [localName, setLocalName] = useState(profileName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [productKey, setProductKey] = useState<{ key: string; activatedAt: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  /* ── 2FA state ── */
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Support state ── */
  const [supportSent, setSupportSent] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: '', message: '' });

  /* ── Integrations state (from AISettings) ── */
  const storeProvider = useAppStore((s: any) => s.provider);
  const activeProvider = useAppStore((s: any) => s.activeProvider);
  const setProvider = useAppStore((s: any) => s.setProvider);
  const setActiveProvider = useAppStore((s: any) => s.setActiveProvider);
  const savedProviderKeys = useAppStore((s: any) => s.savedProviderKeys);
  const setSavedProviderKeys = useAppStore((s: any) => s.setSavedProviderKeys);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [savingProvider, setSavingProvider] = useState(false);

  /* ── Billing & Usage state ── */
  const [billingPlan, setBillingPlan] = useState<any>(null);
  const [usageMetrics, setUsageMetrics] = useState<{
    aiGenerationsToday: number;
    totalTestCases: number;
    totalFiles: number;
    teamMembers: number;
  }>({
    aiGenerationsToday: 0,
    totalTestCases: 0,
    totalFiles: 0,
    teamMembers: 1,
  });
  const [enterpriseSeats, setEnterpriseSeats] = useState(15);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  /* ── Upgrade / Enquiry modals ── */
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<any>(null);
  const [upgradeBilling, setUpgradeBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeProcessing, setUpgradeProcessing] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    company: '',
    teamSize: '',
    contact: '',
    requirements: '',
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    if (!enquirySent) return;
    const timer = setTimeout(() => {
      setEnquirySent(false);
      setEnquiryForm({ company: '', teamSize: '', contact: '', requirements: '' });
    }, 10000);
    return () => clearTimeout(timer);
  }, [enquirySent]);

  const loadBillingData = useCallback(async () => {
    if (activeSection !== 'billing') return;
    setBillingLoading(true);
    try {
      const [usageRes, plansRes] = await Promise.all([
        api.get('/api/billing/usage'),
        api.get('/api/plans'),
      ]);
      if (usageRes.data?.plan) setBillingPlan(usageRes.data.plan);
      if (usageRes.data?.usage) setUsageMetrics(usageRes.data.usage);
      if (plansRes.data?.plans) setAvailablePlans(plansRes.data.plans);
    } catch {
      /* ignore */
    }
    setBillingLoading(false);
  }, [activeSection]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  async function handleLaunchCustomerPortal() {
    setPortalLoading(true);
    try {
      const res = await api.post('/api/payments/create-portal-session');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    getProfile().then((profile) => {
      if (profile.displayName) {
        setProfileName(profile.displayName);
        setLocalName('');
      }
    });
    getProductKey().then(setProductKey);
    check2FAStatus();
  }, [user, setProfileName]);

  useEffect(() => {
    const saved = localStorage.getItem('nextest_picture');
    if (saved) setAvatarUrl(saved);
  }, []);

  async function check2FAStatus() {
    try {
      const res = await api.get<{ user: { twoFactorEnabled: boolean } }>('/api/auth/me');
      const enabled = res.data.user?.twoFactorEnabled || false;
      setTwoFAEnabled(enabled);
      setTwoFAStep(enabled ? 'enabled' : 'idle');
      if (enabled) loadTrustedDevices();
    } catch {
      /* ignore */
    }
  }

  async function loadTrustedDevices() {
    try {
      setTrustedDevices(await getTrustedDevices());
    } catch {
      /* ignore */
    }
  }

  async function handleSetup2FA() {
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      setTwoFASetup(await setup2FA());
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
      setTrustedDevices((prev: TrustedDevice[]) =>
        prev.filter((d: TrustedDevice) => d.id !== deviceId)
      );
    } catch {
      /* ignore */
    }
  }

  async function handleRemoveAllDevices() {
    try {
      await removeAllTrustedDevices();
      setTrustedDevices([]);
    } catch {
      /* ignore */
    }
  }

  function handleSaveName() {
    const name = localName.trim();
    if (!name) return;
    setNameSaving(true);
    saveProfile(name)
      .then(() => {
        return getProfile();
      })
      .then((profile) => {
        const saved = profile.displayName || name;
        setProfileName(saved);
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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
      localStorage.setItem('nextest_picture', dataUrl);
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  }

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    if (supportSubmitting) return;
    setSupportSubmitting(true);
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
    } catch (_e) {
      setSupportSent(true);
    } finally {
      setSupportSubmitting(false);
    }
  }

  /* ── Support auto-reset after 10 seconds ── */
  useEffect(() => {
    if (!supportSent) return;
    const timer = setTimeout(() => {
      setSupportSent(false);
      setSupportForm({ name: '', email: '', subject: '', message: '' });
    }, 10000);
    return () => clearTimeout(timer);
  }, [supportSent]);

  /* ── Upgrade handler ── */
  const refreshBilling = useCallback(async () => {
    try {
      const res = await api.get('/api/user/billing');
      if (res.data?.plan) setBillingPlan(res.data.plan);
    } catch {
      /* ignore */
    }
  }, []);

  async function handleUpgradeSubmit() {
    if (!upgradePlan || upgradeProcessing) return;
    setUpgradeProcessing(true);
    setUpgradeSuccess(false);

    /* Free plan — activate directly */
    if (upgradePlan.id === 'free') {
      try {
        await api.post('/api/user/billing/upgrade', { tier: 'free' });
        setUpgradeSuccess(true);
        await refreshBilling();
      } catch {
        openConfirm('Upgrade Failed', 'Something went wrong. Please try again.', () => {}, 'Close');
      } finally {
        setUpgradeProcessing(false);
      }
      return;
    }

    /* Paid plans — redirect to Stripe checkout */
    try {
      const res = await api.post('/api/user/billing/checkout', { tier: upgradePlan.id });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        openConfirm('Payment Setup', 'Redirecting to payment page...', () => {}, 'Got it');
        setUpgradeProcessing(false);
      }
    } catch {
      openConfirm(
        'Upgrade Failed',
        'Unable to start payment. Please try again later.',
        () => {},
        'Close'
      );
      setUpgradeProcessing(false);
    }
  }

  function closeUpgradeModal() {
    setShowUpgradeModal(false);
    setUpgradeProcessing(false);
    setUpgradeSuccess(false);
  }

  const hasDbKey = storeProvider ? !!savedProviderKeys[storeProvider] : false;
  const selectedProviderObj = selectedProvider
    ? providerOptions.find((o) => o.id === selectedProvider)
    : undefined;
  const activeProviderObj = storeProvider
    ? providerOptions.find((o) => o.id === storeProvider)
    : undefined;
  const saveDisabled = !selectedProvider || selectedProvider === activeProvider || savingProvider;

  async function handleSaveProvider() {
    if (!selectedProvider) return;
    setSavingProvider(true);
    setSettingsError('');
    setSettingsMessage('');
    try {
      await api.put('/api/settings/active-provider', { provider: selectedProvider });
      setActiveProvider(selectedProvider);
      setProvider(selectedProvider);
      setSettingsMessage(`Provider set to ${selectedProviderObj?.label || selectedProvider}.`);
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : 'Failed to save provider.';
      setSettingsError(msg);
    } finally {
      setSavingProvider(false);
    }
  }

  async function handleSaveApiKey() {
    if (!selectedProvider && !storeProvider) {
      setSettingsError('Select a provider first.');
      setSettingsMessage('');
      return;
    }
    const key = apiKeyInput.trim();
    const targetProvider = selectedProvider || storeProvider;
    if (!targetProvider) return;
    if (!key) {
      setSettingsError('Please enter an API key before saving.');
      setSettingsMessage('');
      return;
    }
    try {
      await api.post('/api/settings/api-key', { provider: targetProvider, apiKey: key });
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      window.localStorage.setItem(
        'qacopilot_ai_settings',
        JSON.stringify({ provider: targetProvider, keyHash: hashHex })
      );
      setSavedProviderKeys({ ...savedProviderKeys, [targetProvider]: true });
      setApiKeyInput('');
      setSettingsMessage('API key saved successfully.');
      setSettingsError('');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (error: any) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : 'Unable to save API key.';
      setSettingsError(message);
      setSettingsMessage('');
    }
  }

  async function handleClearApiKey() {
    const targetProvider = selectedProvider || storeProvider;
    if (!targetProvider) return;
    try {
      await api.delete(`/api/settings/api-key?provider=${encodeURIComponent(targetProvider)}`);
      window.localStorage.removeItem('qacopilot_ai_settings');
      setSavedProviderKeys({ ...savedProviderKeys, [targetProvider]: false });
      setApiKeyInput('');
      setSettingsMessage('Saved API key has been removed.');
      setSettingsError('');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (error: any) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : 'Unable to clear saved API key.';
      setSettingsError(msg);
      setSettingsMessage('');
    }
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

  function handleDeleteAccount() {
    openConfirm(
      'Delete Account',
      'This action cannot be undone. All data will be permanently deleted. Are you sure?',
      async () => {
        try {
          await api.post('/api/auth/delete-account');
        } catch (e) {
          console.error('Delete account failed', e);
        }
        logout();
        navigate('/');
      },
      'Delete Account'
    );
  }

  /* ── Body scroll lock when modals open ── */
  useEffect(() => {
    if (showUpgradeModal || showEnterpriseModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUpgradeModal, showEnterpriseModal]);

  if (!user) return null;

  const initials = getInitials(profileName || user.email.split('@')[0]);
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const sectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div
              className="relative overflow-hidden rounded-2xl mb-8"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)',
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                }}
              />
              <div className="relative px-6 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
                <div
                  className="relative shrink-0 cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
                        backdropFilter: 'blur(12px)',
                        border: '2px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="text-center sm:text-left text-white min-w-0 flex-1">
                  <h1 className="text-2xl font-bold drop-shadow-sm truncate">
                    {profileName || 'Your Account'}
                  </h1>
                  <p className="text-sm opacity-90 mt-0.5">{user.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs opacity-75"></div>
                </div>
              </div>
            </div>

            {/* Account Details - Unified Card */}
            <Card className="p-5">
              {/* Header */}
              <div
                className="flex items-center gap-3 pb-5 mb-5"
                style={{ borderBottom: '1px solid var(--color-muted)' }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'var(--color-accent-soft)' }}
                >
                  <svg
                    className="h-5 w-5"
                    style={{ color: 'var(--color-accent)' }}
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
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    Account Details
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Manage your identity and product access.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Display Name Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{ background: 'var(--color-muted)' }}
                    >
                      <svg
                        className="h-4 w-4"
                        style={{ color: 'var(--color-text-secondary)' }}
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
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Display Name
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        How others see you
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-1">
                    <input
                      className="input-modern flex-1 px-4 py-2.5 text-sm"
                      value={localName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLocalName(e.target.value)
                      }
                      placeholder="Enter display name"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        e.key === 'Enter' && handleSaveName()
                      }
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameSaving}
                      className="btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                      type="button"
                    >
                      {nameSaving ? (
                        'Saving...'
                      ) : nameSaved ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>{' '}
                          Saved
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--color-muted)' }} />

                {/* Email Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{ background: 'var(--color-muted)' }}
                    >
                      <svg
                        className="h-4 w-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Email
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Your account email
                      </p>
                    </div>
                  </div>
                  <p className="text-sm flex-1 px-1" style={{ color: 'var(--color-text)' }}>
                    {user.email}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--color-muted)' }} />

                {/* Product Key Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{
                        background: productKey ? 'var(--color-success-soft)' : 'var(--color-muted)',
                      }}
                    >
                      <svg
                        className="h-4 w-4"
                        style={{
                          color: productKey ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}
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
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          Product Key
                        </p>
                        {productKey ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="muted">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        License access
                      </p>
                    </div>
                  </div>
                  {productKey ? (
                    <div className="flex-1 px-1">
                      <p
                        className="text-sm font-mono tracking-wider"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {productKey.key}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Activated {new Date(productKey.activatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm flex-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
                      No product key associated with this account.
                    </p>
                  )}
                  <div
                    className="flex items-center gap-2 mt-3 pt-3 border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: 'var(--color-accent)',
                        color: '#ffffff',
                      }}
                    >
                      Open License Manager
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="p-5 mt-6">
              <div
                className="flex items-center gap-3 pb-5 mb-5"
                style={{ borderBottom: '1px solid var(--color-muted)' }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: twoFAEnabled ? 'var(--color-success-soft)' : 'var(--color-muted)',
                  }}
                >
                  <svg
                    className="h-5 w-5"
                    style={{
                      color: twoFAEnabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
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
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: twoFAEnabled ? 'var(--color-success-soft)' : 'var(--color-muted)',
                    color: twoFAEnabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }}
                >
                  {twoFAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {twoFAStep === 'idle' && (
                <div className="py-6">
                  <div className="text-center mb-6">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4"
                      style={{ background: 'var(--color-muted)' }}
                    >
                      <svg
                        className="h-8 w-8"
                        style={{ color: 'var(--color-text-muted)' }}
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
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                      Protect your account with an extra layer of security
                    </p>
                    <p
                      className="text-xs max-w-md mx-auto"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Two-factor authentication adds a second verification step when signing in.
                      Even if your password is compromised, your account stays protected.
                    </p>
                  </div>

                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{
                      background: 'var(--color-muted-soft)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <p
                      className="text-xs font-semibold mb-2"
                      style={{ color: 'var(--color-text)' }}
                    >
                      How it works:
                    </p>
                    <ol
                      className="text-xs space-y-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <li>
                        1. Download an authenticator app like <strong>Google Authenticator</strong>,{' '}
                        <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong> on your
                        phone.
                      </li>
                      <li>2. Click "Enable 2FA" below to generate a QR code.</li>
                      <li>3. Scan the QR code with your authenticator app.</li>
                      <li>4. Enter the 6-digit code from the app to verify and activate.</li>
                      <li>5. From then on, you will need this code every time you sign in.</li>
                    </ol>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleSetup2FA}
                      disabled={twoFALoading}
                      type="button"
                      className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-surface)' }}
                    >
                      {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              )}

              {twoFAStep === 'setup' && twoFASetup && (
                <div className="py-6">
                  <div className="text-center mb-6">
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                      Scan QR Code
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Open your authenticator app and scan the QR code below.
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any
                      TOTP-compatible app on your phone, tap the + icon, and scan this code.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'var(--color-surface)',
                        border: '2px solid var(--color-border)',
                      }}
                    >
                      <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                    <div className="w-full max-w-sm">
                      <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Or enter this code manually into your app:
                      </p>
                      <div
                        className="flex items-center gap-2 p-3 rounded-xl"
                        style={{
                          background: 'var(--color-muted-soft)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <code
                          className="flex-1 text-xs font-mono break-all"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {twoFASetup.secret}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(twoFASetup.secret)}
                          type="button"
                          className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                          style={{
                            background: 'var(--color-accent-soft)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Choose "Enter setup key" in your authenticator app and paste this code.
                      </p>
                    </div>
                    <div className="w-full max-w-sm">
                      <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Enter the 6-digit code from your app to verify:
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFAToken}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTwoFAToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                        }
                        placeholder="000000"
                        className="w-full py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl outline-none transition-all"
                        style={{
                          background: 'var(--color-muted-soft)',
                          border: `2px solid ${twoFAToken.length === 6 ? 'var(--color-success)' : 'var(--color-border)'}`,
                          color: 'var(--color-text)',
                        }}
                      />
                      {twoFAError && (
                        <p
                          className="text-xs mt-2 text-center"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          {twoFAError}
                        </p>
                      )}
                      <p
                        className="text-xs mt-2 text-center"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        The code refreshes every 30 seconds. Enter it before it expires.
                      </p>
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
                            background: 'var(--color-muted)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEnable2FA}
                          disabled={twoFAToken.length !== 6 || twoFALoading}
                          type="button"
                          className="flex-1 py-2.5 text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                          style={{
                            background: 'var(--color-accent)',
                            color: 'var(--color-surface)',
                          }}
                        >
                          {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {twoFAStep === 'enabled' && (
                <div className="py-4">
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{
                      background: 'var(--color-success-soft)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5"
                        style={{ color: 'var(--color-success)' }}
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
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-success)' }}
                      >
                        Two-factor authentication is enabled
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-success)' }}>
                      When signing in, enter your password first, then enter the 6-digit code from
                      your authenticator app. You can optionally check "Remember this device for 30
                      days" to skip 2FA on browsers you trust.
                    </p>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'var(--color-muted-soft)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <p
                      className="text-sm font-semibold mb-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Disable 2FA
                    </p>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Enter your current authenticator code to disable two-factor authentication.
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFAToken}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTwoFAToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                        }
                        placeholder="000000"
                        className="flex-1 py-2.5 text-center text-lg tracking-[0.3em] font-mono rounded-xl outline-none"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                      <button
                        onClick={handleDisable2FA}
                        disabled={twoFAToken.length !== 6 || twoFALoading}
                        type="button"
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                        style={{
                          background: 'var(--color-danger-soft)',
                          color: 'var(--color-danger)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {twoFALoading ? 'Disabling...' : 'Disable'}
                      </button>
                    </div>
                    {twoFAError && (
                      <p className="text-xs mt-2" style={{ color: 'var(--color-danger)' }}>
                        {twoFAError}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      Once disabled, your authenticator app will no longer generate codes for this
                      account. We recommend keeping 2FA enabled for better security.
                    </p>
                  </div>

                  <div
                    className="mt-4 rounded-xl p-4"
                    style={{
                      background: 'var(--color-muted-soft)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          Trusted Devices
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Devices that skip 2FA for 30 days.
                        </p>
                      </div>
                      {trustedDevices.length > 0 && (
                        <button
                          onClick={handleRemoveAllDevices}
                          type="button"
                          className="text-xs font-semibold cursor-pointer"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          Remove All
                        </button>
                      )}
                    </div>
                    {trustedDevices.length === 0 ? (
                      <p
                        className="text-xs py-3 text-center"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        No trusted devices.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {trustedDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-muted)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className="h-4 w-4"
                                style={{
                                  color: device.isExpired
                                    ? 'var(--color-text-muted)'
                                    : 'var(--color-success)',
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
                                  style={{ color: 'var(--color-text)' }}
                                >
                                  {device.deviceName}
                                </p>
                                <p
                                  className="text-[11px]"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
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
                              style={{ color: 'var(--color-danger)' }}
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

            {/* Support & Account (merged) */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Support & Account
                </h3>
                <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Contact Support */}
                <div className="lg:col-span-2">
                  {supportSent ? (
                    <Card className="p-12 text-center">
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
                      <p
                        className="mt-2 text-sm max-w-md mx-auto"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Thank you for reaching out. Our team will get back to you within 24 hours.
                      </p>
                      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Form will reset automatically in 10 seconds.
                      </p>
                      <button
                        className="btn-secondary px-5 py-2.5 text-sm font-semibold mt-6 cursor-pointer"
                        type="button"
                        onClick={() => {
                          setSupportSent(false);
                          setSupportForm({ name: '', email: '', subject: '', message: '' });
                        }}
                      >
                        Send Another Message
                      </button>
                    </Card>
                  ) : (
                    <Card className="p-6">
                      <div
                        className="flex items-center gap-4 pb-5 mb-5"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
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
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3
                            className="text-base font-bold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Contact Support
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            We typically respond within 24 hours.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={handleSupportSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label
                              htmlFor="settings-name"
                              className="block text-xs font-semibold mb-1.5"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Full Name
                            </label>
                            <input
                              id="settings-name"
                              type="text"
                              required
                              value={supportForm.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSupportForm((p) => ({ ...p, name: e.target.value }))
                              }
                              placeholder="John Doe"
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
                              htmlFor="settings-email"
                              className="block text-xs font-semibold mb-1.5"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Email Address
                            </label>
                            <input
                              id="settings-email"
                              type="email"
                              required
                              value={supportForm.email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSupportForm((p) => ({ ...p, email: e.target.value }))
                              }
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
                            htmlFor="settings-subject"
                            className="block text-xs font-semibold mb-1.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Subject
                          </label>
                          <input
                            id="settings-subject"
                            type="text"
                            required
                            value={supportForm.subject}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setSupportForm((p) => ({ ...p, subject: e.target.value }))
                            }
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
                            htmlFor="settings-message"
                            className="block text-xs font-semibold mb-1.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Message
                          </label>
                          <textarea
                            id="settings-message"
                            required
                            rows={4}
                            value={supportForm.message}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setSupportForm((p) => ({ ...p, message: e.target.value }))
                            }
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
                          disabled={supportSubmitting}
                          className="w-full py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ background: 'var(--accent)', color: 'var(--color-surface)' }}
                        >
                          {supportSubmitting ? (
                            <>
                              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{' '}
                              Sending...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                              </svg>{' '}
                              Send Message
                            </>
                          )}
                        </button>
                      </form>
                    </Card>
                  )}
                </div>

                {/* Account Management */}
                <div className="space-y-5">
                  <Card
                    className="p-5"
                    style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)' }}
                  >
                    <div
                      className="flex items-center gap-3 pb-4 mb-4 border-b"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--danger-soft)' }}
                      >
                        <svg
                          className="h-5 w-5"
                          style={{ color: 'var(--danger)' }}
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
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          Sign Out
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          End your current session.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        background: 'transparent',
                        color: 'var(--danger)',
                        border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                      }}
                    >
                      <svg
                        className="w-4 h-4"
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
                      Sign Out
                    </button>
                  </Card>

                  <Card
                    className="p-5"
                    style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)' }}
                  >
                    <div
                      className="flex items-center gap-3 pb-4 mb-4 border-b"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--danger-soft)' }}
                      >
                        <svg
                          className="h-5 w-5"
                          style={{ color: 'var(--danger)' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          Delete Account
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Permanently remove your account and all associated data.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      type="button"
                      className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                      style={{ background: 'var(--danger)', color: 'var(--color-surface)' }}
                    >
                      Delete Account
                    </button>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Billing & Subscription
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Manage workspace seats, monitor real-time usage, and upgrade plan features.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {billingPlan?.subscriptionEndsAt && (
                  <Badge variant="warning">
                    Renews {new Date(billingPlan.subscriptionEndsAt).toLocaleDateString()}
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={handleLaunchCustomerPortal}
                  disabled={portalLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow"
                >
                  {portalLoading ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                    </svg>
                  )}
                  <span>Manage Billing in Stripe Portal</span>
                </button>
              </div>
            </div>

            {billingLoading ? (
              <div className="flex items-center justify-center py-20">
                <div
                  className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <>
                {/* Active Subscription Summary Banner */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {(billingPlan?.name || 'F')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">
                            {billingPlan?.name || 'Free'} Plan
                          </h3>
                          <Badge
                            variant={
                              billingPlan?.subscriptionStatus === 'active' ? 'success' : 'neutral'
                            }
                          >
                            {billingPlan?.subscriptionStatus || 'Active'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {billingPlan?.monthlyPrice && billingPlan.monthlyPrice > 0
                            ? `₹${billingPlan.monthlyPrice.toLocaleString()}/seat/month (${billingPlan.currency || 'INR'})`
                            : 'Free Plan — Basic limits applied'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Usage Meters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <UsageMeter
                      label="Daily AI Generations"
                      current={usageMetrics.aiGenerationsToday}
                      limit={billingPlan?.aiGenerationsPerDay ?? 20}
                      unit="gens"
                      description="Resets at 00:00 UTC"
                    />
                    <UsageMeter
                      label="Test Case Storage"
                      current={usageMetrics.totalTestCases}
                      limit={billingPlan?.maxTestCases ?? 500}
                      unit="cases"
                      description="Active stored test cases"
                    />
                    <UsageMeter
                      label="Knowledge Base Files"
                      current={usageMetrics.totalFiles}
                      limit={billingPlan?.maxFiles ?? 3}
                      unit="files"
                      description="Uploaded documents"
                    />
                    <UsageMeter
                      label="Workspace Members"
                      current={usageMetrics.teamMembers}
                      limit={billingPlan?.maxUsers ?? 1}
                      unit="seats"
                      description="Active user seats"
                    />
                  </div>
                </Card>

                {/* Seat Selector Component */}
                <SeatSelector seats={enterpriseSeats} onChangeSeats={setEnterpriseSeats} />

                {/* Side-by-Side Plan Comparison Table */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-3">Plan Feature & Limit Matrix</h3>
                  <PlanComparison currentTier={billingPlan?.tier || 'free'} />
                </div>
              </>
            )}
          </div>
        );

      case 'integrations':
        return (
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Integrations
            </h2>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--text-muted)' }}>
              Configure AI providers used for test generation.
            </p>

            {/* No provider warning */}
            {!activeProvider && (
              <div
                className="flex items-start gap-3 rounded-xl px-5 py-4 mb-5"
                style={{
                  background: 'var(--warning-soft)',
                  border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
                }}
              >
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: 'var(--warning)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  <strong>No provider selected</strong> — choose one below and save it. Test
                  generation stays disabled until you do.
                </div>
              </div>
            )}

            {/* Provider Grid */}
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Select Provider
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Click a card to select it, then save to activate.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saveDisabled}
                  onClick={handleSaveProvider}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: saveDisabled ? 'var(--bg-tertiary)' : 'var(--accent)',
                    color: saveDisabled ? 'var(--text-muted)' : 'var(--color-surface)',
                    border: saveDisabled ? '1px solid var(--border-default)' : 'none',
                  }}
                >
                  {savingProvider ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4"
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
                  )}
                  Save provider
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providerOptions.map((option) => {
                  const isActive = storeProvider === option.id;
                  const isSelected = selectedProvider === option.id;
                  const cardStyle = isActive
                    ? {
                        background: 'var(--accent-soft)',
                        borderColor: 'var(--accent)',
                        outline: 'none',
                      }
                    : isSelected
                      ? {
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--accent)',
                          outline: '2px solid var(--accent)',
                          outlineOffset: '-2px',
                        }
                      : {
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--border-subtle)',
                          outline: 'none',
                        };
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider((prev) => (prev === option.id ? null : option.id));
                        setSettingsMessage('');
                        setSettingsError('');
                      }}
                      className="rounded-lg p-5 text-left transition-all min-h-[130px] flex flex-col justify-between"
                      style={cardStyle}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2.5">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {option.label}
                          </p>
                          {isActive ? (
                            <span
                              className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                              style={{ background: 'var(--accent)', color: 'var(--color-surface)' }}
                            >
                              Active
                            </span>
                          ) : isSelected ? (
                            <span
                              className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                            >
                              Selected
                            </span>
                          ) : null}
                        </div>
                        <p
                          className="mt-2 text-xs leading-normal"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {option.description}
                        </p>
                      </div>
                      {isActive ? (
                        <span
                          className="text-xs font-semibold mt-2"
                          style={{ color: 'var(--accent)' }}
                        >
                          Active provider
                        </span>
                      ) : (
                        <span
                          className="text-xs font-semibold mt-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {isSelected ? 'Click to deselect' : 'Click to select'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* API Key */}
            <Card className="p-5">
              <div
                className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5"
                style={{ borderBottom: '1px solid var(--border-default)' }}
              >
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Provider Credentials
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Secure authorization parameters for{' '}
                    {selectedProviderObj?.label ?? activeProviderObj?.label ?? 'selected provider'}.
                  </p>
                </div>
                <Badge variant={hasDbKey ? 'success' : 'warning'}>
                  {hasDbKey ? 'API Key Configured' : 'No Credentials Stored'}
                </Badge>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label
                  className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  API Authorization Token
                  <input
                    className="input-modern w-full px-4 py-3 text-sm"
                    type="password"
                    value={apiKeyInput}
                    onChange={(event) => setApiKeyInput(event.target.value)}
                    placeholder={`Enter ${selectedProviderObj?.label ?? activeProviderObj?.label ?? 'provider'} API key...`}
                  />
                </label>
                <div
                  className="rounded-lg p-4 text-sm leading-relaxed"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <p
                    className="font-semibold uppercase tracking-wider text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Token Status
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {hasDbKey
                      ? 'Your API key is encrypted and stored in the database.'
                      : 'No saved API credentials found. Enter a token above to encrypt and store it securely.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary px-5 py-2.5 text-sm font-semibold"
                  onClick={handleSaveApiKey}
                >
                  Save API Key
                </button>
                <button
                  type="button"
                  className="btn-secondary px-5 py-2.5 text-sm font-semibold"
                  onClick={handleClearApiKey}
                >
                  Clear Credentials
                </button>
              </div>
              {settingsMessage ? (
                <div
                  className="mt-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
                  style={{
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                    border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
                  }}
                >
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{settingsMessage}</span>
                </div>
              ) : null}
              {settingsError ? (
                <div
                  className="mt-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
                  style={{
                    background: 'var(--danger-soft)',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
                  }}
                >
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{settingsError}</span>
                </div>
              ) : null}
            </Card>
          </div>
        );
    }
  };

  return (
    <>
      <div className="animate-fade-in max-w-6xl mx-auto">
        {/* Mobile section selector */}
        <div className="lg:hidden mb-4">
          <select
            value={activeSection}
            onChange={(e) => {
              setActiveSection(e.target.value as Section);
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left"
                  style={{
                    background: activeSection === s.id ? 'var(--accent-soft)' : 'transparent',
                    color: activeSection === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{sectionContent()}</main>
        </div>

        {/* ── Upgrade Modal (Pro) ── */}
        {createPortal(
          <>
            {showUpgradeModal && upgradePlan && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
                onClick={closeUpgradeModal}
              >
                <div
                  className="w-full max-w-[420px] max-h-[90vh] sm:max-h-[85vh] rounded-[20px] sm:rounded-[28px] overflow-hidden relative flex flex-col"
                  style={{
                    background: 'var(--color-surface)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close */}
                  <button
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
                    onClick={closeUpgradeModal}
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Gradient Header */}
                  <div
                    className="relative px-5 sm:px-8 pt-7 sm:pt-10 pb-5 sm:pb-8 text-white shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #EC4899 100%)',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.1) 0%, transparent 40%)',
                      }}
                    />
                    <div className="relative">
                      <div
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <svg
                          className="w-5 h-5 sm:w-7 sm:h-7"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                          />
                        </svg>
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-0.5 sm:mb-1">
                        {upgradePlan.name} Plan
                      </p>
                      <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                        Upgrade Your Workspace
                      </h2>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {/* Price */}
                    <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-6">
                      <div className="flex items-end gap-2">
                        <span
                          className="text-4xl sm:text-[56px] font-black leading-none tracking-tight"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {upgradeBilling === 'monthly' ? (
                            <>
                              ₹{Math.round((upgradePlan.price || 0) / 100).toLocaleString('en-IN')}
                            </>
                          ) : (
                            <>
                              ₹
                              {Math.round(((upgradePlan.price || 0) * 12) / 100).toLocaleString(
                                'en-IN'
                              )}
                            </>
                          )}
                        </span>
                        <span
                          className="text-sm sm:text-base font-medium pb-0.5 sm:pb-1"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          /{upgradeBilling === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {upgradeBilling === 'yearly'
                          ? 'Billed annually — save 17%'
                          : 'Billed monthly'}
                      </p>
                    </div>

                    {/* Toggle */}
                    <div className="px-5 sm:px-8 mb-4 sm:mb-6">
                      <div
                        className="flex rounded-full p-0.5 sm:p-1"
                        style={{ background: 'var(--color-muted)' }}
                      >
                        <button
                          className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300"
                          style={{
                            background:
                              upgradeBilling === 'monthly' ? 'var(--color-text)' : 'transparent',
                            color:
                              upgradeBilling === 'monthly'
                                ? 'var(--color-surface)'
                                : 'var(--color-text-secondary)',
                            boxShadow:
                              upgradeBilling === 'monthly'
                                ? '0 2px 8px rgba(30,41,59,0.2)'
                                : 'none',
                          }}
                          onClick={() => setUpgradeBilling('monthly')}
                        >
                          Monthly
                        </button>
                        <button
                          className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300"
                          style={{
                            background:
                              upgradeBilling === 'yearly' ? 'var(--color-text)' : 'transparent',
                            color:
                              upgradeBilling === 'yearly'
                                ? 'var(--color-surface)'
                                : 'var(--color-text-secondary)',
                            boxShadow:
                              upgradeBilling === 'yearly' ? '0 2px 8px rgba(30,41,59,0.2)' : 'none',
                          }}
                          onClick={() => setUpgradeBilling('yearly')}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="px-5 sm:px-8 mb-5 sm:mb-8">
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {upgradePlan.features?.map((f: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 sm:gap-3 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl transition-all"
                            style={{ background: 'var(--color-muted-soft)' }}
                          >
                            <div
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}
                            >
                              <svg
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            </div>
                            <span
                              className="text-xs sm:text-sm font-medium"
                              style={{ color: 'var(--color-text)' }}
                            >
                              {f}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-5 sm:px-8 pb-5 sm:pb-8">
                      {upgradeSuccess ? (
                        <div className="text-center py-4">
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}
                          >
                            <svg
                              className="w-8 h-8 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                            Upgrade Complete!
                          </h3>
                          <p
                            className="text-sm mt-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Your {upgradePlan.name} plan is now active. A confirmation has been sent
                            to {user.email}.
                          </p>
                          <button
                            className="mt-4 px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all"
                            style={{ background: 'var(--gradient-primary)' }}
                            onClick={closeUpgradeModal}
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <button
                          className="w-full py-3 sm:py-4 text-sm font-bold text-white rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                            boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                            opacity: upgradeProcessing ? 0.7 : 1,
                          }}
                          disabled={upgradeProcessing}
                          onClick={handleUpgradeSubmit}
                        >
                          {upgradeProcessing ? (
                            <>
                              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Subscribe to {upgradePlan.name}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}

        {/* ── Enterprise Enquiry Modal ── */}
        {createPortal(
          <>
            {showEnterpriseModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
                onClick={() => setShowEnterpriseModal(false)}
              >
                <div
                  className="w-full max-w-[420px] max-h-[90vh] sm:max-h-[85vh] rounded-[20px] sm:rounded-[28px] overflow-hidden relative flex flex-col"
                  style={{
                    background: 'var(--color-surface)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close */}
                  <button
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
                    onClick={() => setShowEnterpriseModal(false)}
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Gradient Header */}
                  <div
                    className="relative px-5 sm:px-8 pt-7 sm:pt-10 pb-5 sm:pb-8 text-white shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(124,58,237,0.1) 0%, transparent 40%)',
                      }}
                    />
                    <div className="relative">
                      <div
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <svg
                          className="w-5 h-5 sm:w-7 sm:h-7"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                          />
                        </svg>
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5 sm:mb-1">
                        Enterprise
                      </p>
                      <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                        Contact Sales
                      </h2>
                      <p className="text-xs sm:text-sm mt-1.5 sm:mt-2 opacity-60 leading-relaxed">
                        Get a custom plan for your organization.
                      </p>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="overflow-y-auto flex-1 min-h-0">
                    <div className="px-5 sm:px-8 py-5 sm:py-6">
                      {enquirySent ? (
                        <div className="text-center py-5 sm:py-8">
                          <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}
                          >
                            <svg
                              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          </div>
                          <h3
                            className="text-lg sm:text-xl font-bold"
                            style={{ color: 'var(--color-text)' }}
                          >
                            Sent Successfully!
                          </h3>
                          <p
                            className="text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            We'll get back to you within 24 hours.
                          </p>
                          <button
                            className="w-full mt-5 sm:mt-6 py-2.5 sm:py-3 text-sm font-semibold rounded-xl sm:rounded-2xl transition-all"
                            style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }}
                            onClick={() => {
                              setShowEnterpriseModal(false);
                              setEnquirySent(false);
                              setEnquiryForm({
                                company: '',
                                teamSize: '',
                                contact: '',
                                requirements: '',
                              });
                            }}
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (enquirySubmitting) return;
                            setEnquirySubmitting(true);
                            try {
                              await fetch('https://api.web3forms.com/submit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  access_key: '62dd773d-d156-48a6-baa0-8264963687ee',
                                  subject: `Enterprise Enquiry from ${enquiryForm.company}`,
                                  ...enquiryForm,
                                }),
                              });
                              setEnquirySent(true);
                            } catch {
                              setEnquirySent(true);
                            } finally {
                              setEnquirySubmitting(false);
                            }
                          }}
                          className="space-y-3 sm:space-y-4"
                        >
                          <div>
                            <label
                              className="block text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Company Name
                            </label>
                            <input
                              type="text"
                              required
                              value={enquiryForm.company}
                              onChange={(e) =>
                                setEnquiryForm((p) => ({ ...p, company: e.target.value }))
                              }
                              placeholder="Acme Corp"
                              className="w-full rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm outline-none transition-all"
                              style={{
                                background: 'var(--color-muted-soft)',
                                color: 'var(--color-text)',
                                border: '1.5px solid var(--color-border)',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)';
                                e.currentTarget.style.boxShadow =
                                  '0 0 0 4px var(--color-accent-soft)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            <div>
                              <label
                                className="block text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Team Size
                              </label>
                              <select
                                value={enquiryForm.teamSize}
                                onChange={(e) =>
                                  setEnquiryForm((p) => ({ ...p, teamSize: e.target.value }))
                                }
                                className="w-full rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm outline-none transition-all appearance-none"
                                style={{
                                  background: 'var(--color-muted-soft)',
                                  color: 'var(--color-text)',
                                  border: '1.5px solid var(--color-border)',
                                  backgroundImage:
                                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 10px center',
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                                  e.currentTarget.style.boxShadow =
                                    '0 0 0 4px var(--color-accent-soft)';
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--color-border)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <option value="">Select...</option>
                                <option value="1-10">1 - 10</option>
                                <option value="10-50">10 - 50</option>
                                <option value="50-200">50 - 200</option>
                                <option value="200+">200+</option>
                              </select>
                            </div>
                            <div>
                              <label
                                className="block text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={enquiryForm.contact}
                                onChange={(e) =>
                                  setEnquiryForm((p) => ({ ...p, contact: e.target.value }))
                                }
                                placeholder="+1 555-0123"
                                className="w-full rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm outline-none transition-all"
                                style={{
                                  background: 'var(--color-muted-soft)',
                                  color: 'var(--color-text)',
                                  border: '1.5px solid var(--color-border)',
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                                  e.currentTarget.style.boxShadow =
                                    '0 0 0 4px var(--color-accent-soft)';
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--color-border)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              className="block text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Requirements
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={enquiryForm.requirements}
                              onChange={(e) =>
                                setEnquiryForm((p) => ({ ...p, requirements: e.target.value }))
                              }
                              placeholder="Tell us about your needs..."
                              className="w-full rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm outline-none transition-all resize-none"
                              style={{
                                background: 'var(--color-muted-soft)',
                                color: 'var(--color-text)',
                                border: '1.5px solid var(--color-border)',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)';
                                e.currentTarget.style.boxShadow =
                                  '0 0 0 4px var(--color-accent-soft)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </div>
                          <div className="pt-1 sm:pt-2 pb-1">
                            <button
                              type="submit"
                              disabled={enquirySubmitting}
                              className="w-full py-3 sm:py-4 text-sm font-bold text-white rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              style={{
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                boxShadow: '0 8px 24px rgba(15,23,42,0.3)',
                              }}
                            >
                              {enquirySubmitting ? (
                                <>
                                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{' '}
                                  Sending...
                                </>
                              ) : (
                                'Submit Enquiry'
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    </>
  );
}
