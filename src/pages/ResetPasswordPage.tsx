import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { api } from '../lib/api';
import { AnvilFLogoMark } from '../components/ui/ForgeQALogo';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>]{8,}$/;

const CONSOLE_LOGS = [
  '✓ verifying reset security token ....... valid',
  '✓ checking token expiration ............ active (expires in 58m)',
  '✓ resolving linked account ............. verified',
  '✓ checking active session revocations .. ready',
  '✓ initializing PBKDF2 hash engine ...... 600,000 iterations',
  '✓ ready for credential update .......... pending',
];

export function ResetPasswordPage() {
  useEffect(() => {
    document.title = 'Reset Password — ForgeQA';
  }, []);

  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const pathToken = window.location.pathname.replace(/^\/(auth\/)?reset-password\/?/, '');
  const token = routeToken || queryToken || pathToken || '';

  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Simulated Console Feed for the Hero panel
  const [consoleFeed, setConsoleFeed] = useState<string[]>([]);
  const [feedIndex, setFeedIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConsoleFeed((prev) => {
        const next = [...prev, CONSOLE_LOGS[feedIndex]];
        return next.length > 5 ? next.slice(-5) : next;
      });
      setFeedIndex((i) => (i + 1) % CONSOLE_LOGS.length);
    }, 450);
    return () => clearTimeout(timer);
  }, [feedIndex]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (!message) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/auth');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [message, navigate]);

  // Password Strength calculation
  const rules = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&#^()_+\-=[\]{}|;:,.<>]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (rules.hasLength) score += 1;
    if (rules.hasUpper) score += 1;
    if (rules.hasLower) score += 1;
    if (rules.hasNumber) score += 1;
    if (rules.hasSpecial) score += 1;
    return score;
  }, [rules]);

  const strengthLabel = useMemo(() => {
    if (!password) return { text: 'Empty', color: 'bg-slate-700', width: '0%' };
    if (strengthScore <= 2) return { text: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (strengthScore <= 4) return { text: 'Good', color: 'bg-amber-500', width: '65%' };
    return { text: 'Strong & Secure', color: 'bg-emerald-500', width: '100%' };
  }, [password, strengthScore]);

  const isMatch = password && confirm && password === confirm;
  const isFormValid = strengthScore === 5 && isMatch;

  function handleKeyUp(e: React.KeyboardEvent) {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Password reset token is missing or invalid. Please request a new link.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ message: string }>('/api/auth/reset-password', {
        token,
        password,
      });
      setMessage(res.data.message || 'Password has been reset successfully. You can now sign in.');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || 'Unable to reset password.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--paper, #f8fafc)' }}>
      {/* ── Left panel — Security Branding + Live Verification Feed ── */}
      <div
        className="hidden lg:flex lg:w-[50%] flex-col relative overflow-hidden p-12 justify-between"
        style={{ background: 'var(--ink, #0a0a0f)' }}
      >
        {/* Ambient Gradient Glows */}
        <div
          className="absolute top-0 right-0 w-[480px] h-[480px] opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3158FF 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[420px] h-[420px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
        />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <AnvilFLogoMark size={34} />
          <div className="flex flex-col leading-none">
            <span
              className="text-lg font-extrabold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Forge<span className="text-cyan-400">QA</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 mt-0.5">
              Security Access Control
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-6">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>End-to-End Cryptographic Security</span>
          </div>

          <h1
            className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reclaim access to your{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #3158FF, #3DD9FF, #A855F7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              workspace
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
            Create a robust, modern passphrase to restore complete access to your test suites, AI
            generators, and automated pipelines.
          </p>

          {/* Security Terminal Simulation Feed */}
          <div className="p-4 rounded-xl bg-black/50 border border-slate-800 backdrop-blur-md max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AUTH_TOKEN_STREAM</span>
              </span>
              <span className="text-slate-500">TLS 1.3 SECURE</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs text-emerald-400/90 leading-snug min-h-[110px]">
              {consoleFeed.map((line, idx) => (
                <div key={idx} className="animate-fade-in truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — Interactive Reset Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-16 py-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Branded Header */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-2">
            <AnvilFLogoMark size={32} />
            <span
              className="text-lg font-bold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Forge<span className="text-cyan-600">QA</span>
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2
              className="text-2xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {message ? 'Password Successfully Reset' : 'Set New Password'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {message
                ? 'Your credentials have been securely updated.'
                : 'Choose a strong password to safeguard your account.'}
            </p>
          </div>

          {/* Missing Token Alert */}
          {!token && !message && (
            <div className="rounded-2xl p-5 bg-rose-50 border border-rose-200/80 text-rose-900 space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-800">Invalid or Missing Token</h4>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                    This password reset link is invalid, broken, or has expired. Please request a
                    fresh reset link from the login page.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <span>Back to Sign In / Request New Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Success Card */}
          {message ? (
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xl space-y-5 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">All Set!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {message} Any previous active login sessions have been invalidated for security.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-mono">
                Redirecting to Sign In in{' '}
                <span className="font-bold text-indigo-600">{redirectCountdown}s</span>...
              </div>

              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            token && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="reset_new_password"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      New Password
                    </label>
                    {capsLockActive && (
                      <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 animate-pulse">
                        Caps Lock is ON
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="reset_new_password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={handleKeyUp}
                      placeholder="Enter new passphrase"
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter Bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-0.5 animate-fade-in">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className="font-semibold text-slate-700">{strengthLabel.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full ${strengthLabel.color} transition-all duration-300 rounded-full`}
                        style={{ width: strengthLabel.width }}
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password Input */}
                <div>
                  <label
                    htmlFor="reset_confirm_password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset_confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyUp={handleKeyUp}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Requirements Checklist */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <span className="block font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                    Password Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {rules.hasLength ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          rules.hasLength ? 'text-slate-800 font-medium' : 'text-slate-500'
                        }
                      >
                        8+ characters
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rules.hasUpper && rules.hasLower ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          rules.hasUpper && rules.hasLower
                            ? 'text-slate-800 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        Upper & lower case
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rules.hasNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          rules.hasNumber ? 'text-slate-800 font-medium' : 'text-slate-500'
                        }
                      >
                        At least 1 number
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rules.hasSpecial ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          rules.hasSpecial ? 'text-slate-800 font-medium' : 'text-slate-500'
                        }
                      >
                        Special character (@$!%*...)
                      </span>
                    </div>
                  </div>

                  {confirm.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px]">
                      {isMatch ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span
                        className={
                          isMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-medium'
                        }
                      >
                        {isMatch ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>

                {/* Back to Sign In Link */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                  >
                    Remember your password?{' '}
                    <span className="text-blue-600 font-semibold underline">Sign In</span>
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
