import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type AuthResponse } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { NexTestIcon } from "../components/ui/NexTestLogo";

const KEY_FORMAT = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

function isValidKey(value: string) {
  return KEY_FORMAT.test(value);
}

function formatKey(value: string) {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const groups = [];
  for (let i = 0; i < cleaned.length && groups.length < 5; i += 5) {
    groups.push(cleaned.slice(i, i + 5));
  }
  return groups.join("-");
}

export function CompleteRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAppStore((s) => s.setUser);
  const setSavedProviderKeys = useAppStore((s) => s.setSavedProviderKeys);

  const emailFromUrl = searchParams.get("email") || "";
  const keyFromUrl = searchParams.get("key") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [productKey, setProductKey] = useState(keyFromUrl);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!emailFromUrl) return;
    return () => clearTimeout(debounceRef.current);
  }, [emailFromUrl]);

  useEffect(() => {
    if (!email || !productKey || !isValidKey(productKey)) {
      setKeyStatus("idle");
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setKeyStatus("checking");
      try {
        const res = await api.post("/api/auth/validate-key", { productKey });
        setKeyStatus(res.data.valid ? "valid" : "invalid");
      } catch {
        setKeyStatus("invalid");
      }
    }, 400);
  }, [productKey, email]);

  // Auto-submit when both email and key are pre-filled and validated
  useEffect(() => {
    if (!keyFromUrl || !emailFromUrl || keyStatus !== "valid") return;
    const timer = setTimeout(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    }, 600);
    return () => clearTimeout(timer);
  }, [keyStatus, keyFromUrl, emailFromUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>("/api/auth/complete-registration", { email, productKey });
      setUser(res.data.user);
      try {
        const keysRes = await api.get<{ keys: Record<string, boolean> }>("/api/settings/api-keys");
        setSavedProviderKeys(keysRes.data.keys ?? {});
      } catch { /* ignore */ }
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Registration failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden reg-bg-mesh">

      <div className="relative w-full max-w-md reg-card p-6 sm:p-8 animate-slide-up">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--accent)" }}>
            <NexTestIcon size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-4" style={{ color: "var(--text-primary)" }}>Activate your account</h1>
          <p className="text-xs sm:text-sm mt-1 text-center" style={{ color: "var(--text-muted)" }}>
            Enter the product key sent to your email to finish setting up your account.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm animate-shake" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2.5 px-3.5 text-sm rounded-lg outline-none transition-all"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
            />
          </div>

          <div>
            <label htmlFor="productKey" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Product Key</label>
            <div className="relative">
              <input id="productKey" type="text" inputMode="text" autoComplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29}
                value={productKey} onChange={(e) => setProductKey(formatKey(e.target.value))}
                className="w-full py-2.5 px-3.5 pr-10 text-sm tracking-widest font-mono rounded-lg outline-none transition-all"
                style={{
                  background: "var(--bg-tertiary)", color: "var(--text-primary)",
                  border: `1px solid ${keyStatus === "valid" ? "var(--success)" : keyStatus === "invalid" ? "var(--danger)" : "var(--border-default)"}`,
                }}
                onFocus={(e) => { if (keyStatus === "idle") e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { if (keyStatus === "idle") e.target.style.borderColor = "var(--border-default)"; }}
              />
              {productKey.length > 0 && (
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  {keyStatus === "checking" ? (
                    <span className="h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: "var(--text-muted)" }} />
                  ) : keyStatus === "valid" ? (
                    <svg className="h-5 w-5" style={{ color: "var(--success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : keyStatus === "invalid" ? (
                    <svg className="h-5 w-5" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : null}
                </span>
              )}
            </div>
            {keyStatus === "invalid" && <p className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>This key is invalid, expired, or already used.</p>}
          </div>

          <button type="submit" disabled={isLoading || !isValidKey(productKey)}
            className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg"
          >
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : "Activate Account"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Didn&apos;t get the email?{" "}
            <button onClick={() => navigate("/auth")} className="font-semibold hover:opacity-75 transition-opacity" style={{ color: "var(--accent)" }}>Contact support</button>
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <button onClick={() => navigate("/auth")} className="font-semibold hover:opacity-75 transition-opacity" style={{ color: "var(--accent)" }}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
