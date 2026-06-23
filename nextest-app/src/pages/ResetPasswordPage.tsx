import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../lib/api";
import { NexTestIcon } from "../components/ui/NexTestLogo";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const res = await api.post<{ message: string }>("/api/auth/reset-password", { token, password });
      setMessage(res.data.message);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || "Unable to reset password.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="absolute top-[-15%] left-[-10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-full opacity-[0.06] pointer-events-none animate-float-slow max-sm:hidden" style={{ background: "var(--accent-violet)", filter: "blur(180px)" }} />
      <div className="absolute bottom-[-15%] right-[-10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-full opacity-[0.05] pointer-events-none animate-float-slow max-sm:hidden" style={{ background: "var(--accent-cyan)", filter: "blur(180px)" }} />
      <div className="relative w-full max-w-sm sm:max-w-md rounded-lg p-5 sm:p-8 animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
        <div className="flex flex-col items-center mb-8">
          <NexTestIcon size="lg" />
          <h1 className="text-2xl font-bold tracking-tight mt-4 gradient-text">NexTest</h1>
          <p className="text-sm mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
            Set a new password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div>
            <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}>
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
            <button onClick={() => navigate("/")} className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer" type="button">
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                New Password
              </label>
              <input id="password" type="password" className="input-modern w-full px-4 py-3 text-sm" placeholder="Min 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Confirm Password
              </label>
              <input id="confirm" type="password" className="input-modern w-full px-4 py-3 text-sm" placeholder="Re-enter new password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer">
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
