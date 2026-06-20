import { useState, type FormEvent } from "react";
import { useAdminStore } from "../store/useAdminStore";

export function LoginPage() {
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">TF</div>
          <h1>License Manager</h1>
          <p>Sign in to manage product keys and customers.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input className="login-input" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nextest.app"
              autoComplete="email"
              spellCheck={false}
            />
          </div>

          <div className="login-input-group">
            <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input className="login-input" type={showPassword ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: "var(--text-muted)", display: "flex", alignItems: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{
              width: "100%", justifyContent: "center", padding: "12px 16px",
              fontSize: 14, borderRadius: "var(--radius-md)", marginTop: 8,
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white", borderRadius: "50%",
                  animation: "lm-spin 0.6s linear infinite",
                }} />
                Signing in...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" />
                </svg>
                Sign In
              </span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>NexTest License Manager <span>v0.1.0</span></p>
        </div>
      </div>
    </div>
  );
}
