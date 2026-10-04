import { useState, useEffect, type FormEvent } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { api } from '../lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AnvilFLogoMark } from '../components/ForgeQALogo';
import '../index.css';

function Spinner() {
  return <Loader2 size={18} className="lk-login-spinner" />;
}

export function LoginPage({ onBack }: { onBack?: () => void }) {
  const { login, setupAdmin, error: storeError } = useAdminStore();
  const [isSetupMode, setIsSetupMode] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<{ hasAdmin: boolean }>('/api/admin/setup-status')
      .then((res) => {
        if (mounted) {
          setIsSetupMode(!res.data.hasAdmin);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsSetupMode(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const error = localError || storeError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (isSetupMode) {
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSetupMode) {
        await setupAdmin(trimmed, password);
      } else {
        await login(trimmed, password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lk-login-root">
      <div className="lk-blob lk-blob-1" style={{ width: 500, height: 500 }} />
      <div className="lk-blob lk-blob-2" style={{ width: 400, height: 400 }} />

      {onBack && (
        <button className="lk-login-back" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={2} />
          Back to home
        </button>
      )}

      <div className="lk-login-card">
        <div className="lk-login-card-inner">
          <div className="lk-login-header">
            <div className="flex justify-center mb-3">
              <AnvilFLogoMark size={48} />
            </div>
            <h1 className="lk-login-title">
              ForgeQA <span style={{ color: '#06B6D4' }}>License Manager</span>
            </h1>
            <p className="lk-login-desc">
              {isSetupMode
                ? 'Dynamic First-Time Setup: create your primary administrator account.'
                : 'Sign in to manage product keys, plans, and customer accounts.'}
            </p>
            {isSetupMode && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#06B6D4',
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 10,
                }}
              >
                <Sparkles size={14} />
                Dynamic Admin Initialization
              </div>
            )}
          </div>

          {error && (
            <div className="lk-login-alert">
              <AlertCircle size={16} strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="lk-login-form">
            <div className="lk-login-field">
              <label className="lk-login-label" htmlFor="login-email">
                {isSetupMode ? 'Administrator Email' : 'Email'}
              </label>
              <div className="lk-login-input-wrap">
                <span className="lk-login-input-icon">
                  <Mail size={18} strokeWidth={1.8} />
                </span>
                <input
                  id="login-email"
                  className="lk-login-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSetupMode ? 'admin@yourcompany.com' : 'admin@company.com'}
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="lk-login-field">
              <label className="lk-login-label" htmlFor="login-password">
                {isSetupMode ? 'Choose Password' : 'Password'}
              </label>
              <div className="lk-login-input-wrap">
                <span className="lk-login-input-icon">
                  <Lock size={18} strokeWidth={1.8} />
                </span>
                <input
                  id="login-password"
                  className="lk-login-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isSetupMode ? 'Create a strong password (min 8 chars)' : 'Enter your password'
                  }
                  autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="lk-login-toggle-vis"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            {isSetupMode && (
              <div className="lk-login-field">
                <label className="lk-login-label" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="lk-login-input-wrap">
                  <span className="lk-login-input-icon">
                    <Lock size={18} strokeWidth={1.8} />
                  </span>
                  <input
                    id="confirm-password"
                    className="lk-login-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat chosen password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="lk-login-toggle-vis"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} strokeWidth={1.8} />
                    ) : (
                      <Eye size={18} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button className="lk-login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  {isSetupMode ? 'Configuring Account...' : 'Signing in...'}
                </>
              ) : isSetupMode ? (
                <>
                  Initialize Admin Account
                  <ArrowRight size={16} strokeWidth={2.2} />
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} strokeWidth={2.2} />
                </>
              )}
            </button>
          </form>

          <div className="lk-login-footer">
            <span>ForgeQA License Manager</span>
            <span className="lk-login-version">Dynamic Auth v0.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
