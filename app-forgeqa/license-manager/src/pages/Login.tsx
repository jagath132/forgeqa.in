import { useState, type FormEvent } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";

function Spinner() {
  return <Loader2 size={18} className="lk-login-spinner" />;
}

export function LoginPage({ onBack }: { onBack?: () => void }) {
  const { login, error: storeError } = useAdminStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const error = localError || storeError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message);
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
            <div className="lk-login-logo">
              <Check size={20} strokeWidth={2.5} />
            </div>
            <h1 className="lk-login-title">ForgeKey</h1>
            <p className="lk-login-desc">Sign in to manage product keys and customers.</p>
          </div>

          {error && (
            <div className="lk-login-alert">
              <AlertCircle size={16} strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="lk-login-form">
            <div className="lk-login-field">
              <label className="lk-login-label" htmlFor="login-email">Email</label>
              <div className="lk-login-input-wrap">
                <span className="lk-login-input-icon"><Mail size={18} strokeWidth={1.8} /></span>
                <input
                  id="login-email"
                  className="lk-login-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="lk-login-field">
              <label className="lk-login-label" htmlFor="login-password">Password</label>
              <div className="lk-login-input-wrap">
                <span className="lk-login-input-icon"><Lock size={18} strokeWidth={1.8} /></span>
                <input
                  id="login-password"
                  className="lk-login-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lk-login-toggle-vis"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <button className="lk-login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  Signing in...
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
            <span>ForgeKey License Manager</span>
            <span className="lk-login-version">v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
