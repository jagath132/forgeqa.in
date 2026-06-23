import { useState, useEffect, FormEvent, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api, setStoredToken, type AuthResponse } from "../lib/api";
import { useAppStore } from "../store/useAppStore";

type AuthMode = "login" | "forgot";

const CONSOLE_LINES = [
  "✓ login flow ........................ passed",
  "✓ token validation ................. 0.3s",
  "✓ test suite (12/12) ............... passed",
  "✓ api contract ..................... verified",
  "✓ db connection .................... 4ms",
  "✓ cache invalidation ............... ok",
  "✓ auth middleware .................. passed",
  "✓ rate limiter ..................... 2ms",
  "✓ input sanitization ............... clean",
  "✓ response format .................. valid",
  "✓ ssl handshake .................... 12ms",
  "✓ csrf check ....................... passed",
  "✓ cors policy ...................... valid",
  "✓ session store .................... ok",
  "✓ request validation ............... passed",
  "✓ permission check ................. ok",
  "✓ audit log ........................ written",
  "✓ running suite (12/12) ............ ",
];

function ConsoleFeed() {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayed((prev) => {
        const next = [...prev, CONSOLE_LINES[index]];
        return next.length > 8 ? next.slice(-8) : next;
      });
      setIndex((i) => (i + 1) % CONSOLE_LINES.length);
    }, 320);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="relative" style={{ height: "14rem" }}>
      {displayed.map((line, i) => (
        <div key={`${i}-${line}`} className="animate-console-line text-sm leading-[1.75rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--signal-green)", whiteSpace: "nowrap" }}>
          {line}
        </div>
      ))}
    </div>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const setSavedProviderKeys = useAppStore((s) => s.setSavedProviderKeys);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const twoFARef = useRef<HTMLInputElement | null>(null);
  const [btnSuccess, setBtnSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      if (mode === "login") {
        const payload: Record<string, string> = { email, password };
        if (require2FA && twoFactorCode) payload.twoFactorCode = twoFactorCode;
        const res = await api.post<AuthResponse & { require2FA?: boolean; email?: string }>("/api/auth/login", payload);
        if (res.data.require2FA) {
          setRequire2FA(true);
          setTwoFactorCode("");
          setTimeout(() => twoFARef.current?.focus(), 100);
          setIsLoading(false);
          return;
        }
        setBtnSuccess(true);
        setStoredToken(res.data.token);
        const isNewUser = !res.data.user.has_seen_welcome;
        setTimeout(() => {
          setUser(res.data.user);
          try {
            api.get<{ keys: Record<string, boolean> }>("/api/settings/api-keys").then((kr) => setSavedProviderKeys(kr.data.keys ?? {})).catch(() => {});
          } catch { /* ignore */ }
          navigate(isNewUser ? "/dashboard?welcome=true" : "/dashboard");
        }, 400);
      } else {
        const res = await api.post<{ message: string; resetLink?: string }>("/api/auth/forgot-password", { email });
        setSuccessMessage(res.data.message);
        if (res.data.resetLink) setResetLink(res.data.resetLink);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || "An error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError("");
    setSuccessMessage("");
    setResetLink("");
    setRequire2FA(false);
    setTwoFactorCode("");
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Left panel — branding + console feed */}
      <div className="hidden md:flex md:w-[55%] flex-col relative overflow-hidden" style={{ background: "var(--ink)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-10 pt-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--signal-green)" }}>
            <svg className="h-5 w-5 text-[var(--ink)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--paper)", fontFamily: "var(--font-sans)" }}>NexTest</span>
        </div>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center px-10">
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-3 gradient-shift" style={{ fontFamily: "var(--font-sans)" }}>
            Ship with<br />confidence
          </h1>
          <p className="text-base max-w-sm" style={{ color: "rgba(247,248,246,0.55)", fontFamily: "var(--font-sans)" }}>
            QA automation that catches regressions before they ship.
          </p>

          {/* Console feed */}
          <div className="mt-12" style={{ fontFamily: "var(--font-mono)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--signal-green)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(47,214,117,0.5)" }}>Test Runner</span>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <ConsoleFeed />
            </div>
          </div>
        </div>

        {/* Bottom subtle branding */}
        <div className="px-10 pb-8">
          <p className="text-xs" style={{ color: "rgba(247,248,246,0.2)", fontFamily: "var(--font-mono)" }}>
            $ nex test —quiet —reporter=spec
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="w-full md:w-[45%] flex items-center justify-center px-6 py-10 md:py-0" style={{ background: "var(--paper)" }}>
        <div className="w-full max-w-sm">

          {/* Toggle */}
          <div className="flex p-0.5 mb-8 rounded-lg" style={{ background: "var(--mist)", border: "1px solid var(--mist)" }}>
            {(["login", "register"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => t === "register" ? navigate("/register") : switchMode("login")}
                className="flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer"
                style={{
                  background: mode === "login" && t === "login" ? "var(--ink)" : "transparent",
                  color: mode === "login" && t === "login" ? "var(--paper)" : "var(--graphite)",
                }}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success (forgot mode) */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(47,214,117,0.08)", color: "var(--signal-green)", border: "1px solid rgba(47,214,117,0.2)" }}
            >
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Forgot success state */}
          {mode === "forgot" && successMessage ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(47,214,117,0.12)" }}>
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="var(--signal-green)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm max-w-xs" style={{ color: "var(--graphite)" }}>
                  Check your inbox and click the reset link to continue.
                </p>
              </div>
              {resetLink && (
                <a href={resetLink}
                  className="w-full py-2.5 text-sm font-semibold inline-block text-center no-underline cursor-pointer rounded-lg transition-all"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  Open Reset Link
                </a>
              )}
              <button onClick={() => switchMode("login")}
                className="w-full py-2.5 text-sm font-semibold cursor-pointer rounded-lg transition-all"
                style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {/* Email */}
              <div>
                <label htmlFor="auth_email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>Email</label>
                <input id="auth_email" name="auth_email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="off"
                  className="w-full text-sm outline-none transition-all pb-2 pt-0.5"
                  style={{
                    color: "var(--ink)",
                    background: "transparent",
                    border: "none",
                    borderBottom: "2px solid var(--mist)",
                    fontFamily: "var(--font-sans)",
                  }}
                  onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                  onBlur={(e) => { e.target.style.borderBottomColor = "var(--mist)"; }}
                />
              </div>

              {/* Password */}
              {mode === "login" && (
                <div>
                  <label htmlFor="auth_password" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>Password</label>
                  <div className="relative">
                    <input id="auth_password" name="auth_password" type={showPassword ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      className="w-full text-sm outline-none transition-all pb-2 pt-0.5 pr-8"
                      style={{
                        color: "var(--ink)",
                        background: "transparent",
                        border: "none",
                        borderBottom: "2px solid var(--mist)",
                        fontFamily: "var(--font-sans)",
                      }}
                      onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                      onBlur={(e) => { e.target.style.borderBottomColor = "var(--mist)"; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 cursor-pointer" style={{ color: "var(--graphite)" }}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              {mode === "login" && !require2FA && (
                <div className="flex justify-end -mt-3">
                  <button type="button" onClick={() => switchMode("forgot")}
                    className="text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ color: "var(--graphite)", background: "none", border: "none", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* 2FA */}
              {mode === "login" && require2FA && (
                <div className="animate-fade-in">
                  <div className="p-4 rounded-xl mb-4 text-center" style={{ background: "rgba(47,214,117,0.06)", border: "1px solid rgba(47,214,117,0.15)" }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--signal-green)" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Two-Factor Authentication</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--graphite)" }}>Enter the 6-digit code from your authenticator app.</p>
                  </div>
                  <div className="relative">
                    <input
                      ref={twoFARef}
                      id="twoFactorCode" type="text" inputMode="numeric" autoComplete="one-time-code"
                      maxLength={6} placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6); setTwoFactorCode(v); }}
                      className="w-full py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-lg outline-none transition-all"
                      style={{
                        color: "var(--ink)",
                        background: "transparent",
                        border: "none",
                        borderBottom: `2px solid ${twoFactorCode.length === 6 ? "var(--signal-green)" : "var(--mist)"}`,
                        letterSpacing: "0.5em",
                      }}
                      onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                      onBlur={(e) => { e.target.style.borderBottomColor = twoFactorCode.length === 6 ? "var(--signal-green)" : "var(--mist)"; }}
                    />
                  </div>
                  <button type="button" onClick={() => { setRequire2FA(false); setTwoFactorCode(""); setError(""); }}
                    className="mt-2 w-full text-xs py-1.5 font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--graphite)", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    ← Back to password
                  </button>
                </div>
              )}

              {/* Submit button */}
              {mode === "login" && (
                <button type="submit" disabled={isLoading || !email || !password || (require2FA && twoFactorCode.length < 6)}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: btnSuccess ? "var(--signal-green)" : "var(--ink)",
                    color: "var(--paper)",
                    border: "none",
                  }}
                >
                  {isLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                  ) : btnSuccess ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Signed in
                    </>
                  ) : require2FA ? (
                    "Verify Code"
                  ) : (
                    "Sign In"
                  )}
                </button>
              )}

              {/* Forgot mode submit */}
              {mode === "forgot" && (
                <button type="submit" disabled={isLoading || !email}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                >
                  {isLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                  ) : "Send Reset Link"}
                </button>
              )}
            </form>
          )}

          {/* Mobile: back-to-home */}
          <div className="mt-8 flex justify-center">
            <button onClick={() => navigate("/")} type="button"
              className="text-xs font-semibold transition-all hover:opacity-70 cursor-pointer px-4 py-2 rounded-lg"
              style={{ color: "var(--graphite)", background: "var(--mist)", border: "none" }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
