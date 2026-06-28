import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

const KEY_FORMAT = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

const CONSOLE_LINES = [
  "✓ key verification ................. passed",
  "✓ product validation ............... 0.3s",
  "✓ license check .................... valid",
  "✓ expiry check ..................... ok",
  "✓ activation slot .................. available",
  "✓ user lookup ...................... found",
  "✓ account setup .................... ready",
  "✓ registration ..................... ",
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

  const emailFromUrl = searchParams.get("email") || "";
  const keyFromUrl = searchParams.get("key") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [productKey, setProductKey] = useState(keyFromUrl);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [btnSuccess, setBtnSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Support modal
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);

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
        if (res.data.valid) {
          setKeyStatus("valid");
        } else {
          setKeyStatus("invalid");
        }
      } catch {
        setKeyStatus("invalid");
      }
    }, 400);
  }, [productKey, email]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/complete-registration", { email, productKey });
      setBtnSuccess(true);
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

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    setSupportSending(true);
    try {
      await api.post("/api/auth/support", {
        name: supportForm.name || email || "Unknown",
        email: supportForm.email || email || "unknown@example.com",
        subject: supportForm.subject || "Activation Support",
        message: supportForm.message || `Need help activating product key: ${productKey || "N/A"}`,
      });
      setSupportSent(true);
    } catch {
      setSupportSent(true);
    } finally {
      setSupportSending(false);
    }
  }

  const hasPreFilledKey = !!keyFromUrl;
  const showKeyCard = hasPreFilledKey && keyStatus !== "idle";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Left panel — branding + console feed */}
      <div className="hidden md:flex md:w-[55%] flex-col relative overflow-hidden" style={{ background: "var(--ink)" }}>
        <div className="flex items-center gap-2.5 px-10 pt-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--signal-green)" }}>
            <svg className="h-5 w-5 text-[var(--ink)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--paper)", fontFamily: "var(--font-sans)" }}>ForgeQA</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-10">
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-3 gradient-shift" style={{ fontFamily: "var(--font-sans)" }}>
            Activate your<br />account
          </h1>
          <p className="text-base max-w-sm" style={{ color: "rgba(247,248,246,0.55)", fontFamily: "var(--font-sans)" }}>
            Enter your product key to finish setting up your account.
          </p>

          <div className="mt-12" style={{ fontFamily: "var(--font-mono)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--signal-green)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(47,214,117,0.5)" }}>Activation Checks</span>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <ConsoleFeed />
            </div>
          </div>
        </div>

        <div className="px-10 pb-8">
          <p className="text-xs" style={{ color: "rgba(247,248,246,0.2)", fontFamily: "var(--font-mono)" }}>
            $ nex activate —key=***** —quiet
          </p>
        </div>
      </div>

      {/* Right panel — activation form */}
      <div className="w-full md:w-[45%] flex items-center justify-center px-6 py-10 md:py-0" style={{ background: "var(--paper)" }}>
        <div className="w-full max-w-sm">

          {/* Key card banner — shows when key is pre-filled from email link */}
          {showKeyCard && (
            <div className="mb-6 p-5 rounded-xl animate-slide-up text-center" style={{
              background: keyStatus === "invalid" ? "rgba(239,68,68,0.06)" : "rgba(47,214,117,0.08)",
              border: `1px solid ${keyStatus === "invalid" ? "rgba(239,68,68,0.2)" : "rgba(47,214,117,0.2)"}`,
            }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{
                background: keyStatus === "invalid" ? "rgba(239,68,68,0.12)" : keyStatus === "valid" ? "rgba(47,214,117,0.15)" : "rgba(47,214,117,0.1)",
              }}>
                {keyStatus === "checking" ? (
                  <span className="h-6 w-6 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: "var(--signal-green)" }} />
                ) : keyStatus === "valid" ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--signal-green)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-bold mb-1" style={{
                color: keyStatus === "valid" ? "var(--signal-green)" : keyStatus === "invalid" ? "var(--danger)" : "var(--ink)",
              }}>
                {keyStatus === "checking" ? "Verifying Key..." : keyStatus === "valid" ? "Key Verified" : "Key Not Found"}
              </p>
              <p className="text-xs font-mono tracking-widest" style={{ color: "var(--ink)" }}>{productKey}</p>
              {keyStatus === "valid" && (
                <p className="text-xs mt-2" style={{ color: "var(--graphite)" }}>Key is valid. Click "Activate Account" to complete activation.</p>
              )}
              {keyStatus === "invalid" && (
                <p className="text-xs mt-2" style={{ color: "var(--graphite)" }}>This key doesn't exist in our system. Try a different key or contact support.</p>
              )}
            </div>
          )}

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

          {btnSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.6)" }}>
              <div className="w-full max-w-sm mx-4 p-8 rounded-2xl text-center animate-slide-up" style={{ background: "var(--paper)" }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(255,183,77,0.15)" }}>
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L20 8V16L12 22L4 16V8L12 2Z" fill="#FFB74D" stroke="#FFA726" strokeWidth="1.5" />
                    <polygon points="12,6 16,9 16,15 12,18 8,15 8,9" fill="var(--paper)" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ink)" }}>Welcome to ForgeQA</h2>
                <p className="text-sm mb-7" style={{ color: "var(--graphite)" }}>
                  Your account is all set. Sign in to start testing.
                </p>
                <button onClick={() => navigate("/auth")}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all hover:opacity-85"
                  style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
          {!btnSuccess && (
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
              <div>
                <label htmlFor="activation_email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>Email</label>
                <input id="activation_email" type="email" required value={email}
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

              <div>
                <label htmlFor="activation_key" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>Product Key</label>
                <div className="relative">
                  <input id="activation_key" type="text" inputMode="text" autoComplete="off"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29}
                    value={productKey}
                    onChange={(e) => setProductKey(formatKey(e.target.value))}
                    className="w-full tracking-[0.15em] font-mono outline-none transition-all pb-2 pt-0.5 pr-8 text-sm"
                    style={{
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${keyStatus === "valid" ? "var(--signal-green)" : keyStatus === "invalid" ? "var(--danger)" : "var(--mist)"}`,
                    }}
                    onFocus={(e) => {
                      if (keyStatus === "idle") e.target.style.borderBottomColor = "var(--signal-green)";
                    }}
                    onBlur={(e) => {
                      if (keyStatus === "idle") e.target.style.borderBottomColor = "var(--mist)";
                    }}
                  />
                  {productKey.length > 0 && (
                    <span className="absolute right-0 top-0 pointer-events-none">
                      {keyStatus === "checking" ? (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: "var(--graphite)" }} />
                      ) : keyStatus === "valid" ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="var(--signal-green)" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : keyStatus === "invalid" ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : null}
                    </span>
                  )}
                </div>
                {keyStatus === "invalid" && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>
                    This key is invalid, expired, or already used.
                  </p>
                )}
              </div>

              <button type="submit" disabled={isLoading || !isValidKey(productKey) || btnSuccess}
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
                    Key Verified — Sign In
                  </>
                ) : (
                  "Activate Account"
                )}
              </button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-8 space-y-3">
            <div className="flex justify-center">
              <button onClick={() => navigate("/auth")} type="button"
                className="text-xs font-semibold transition-all hover:opacity-70 cursor-pointer px-4 py-2 rounded-lg"
                style={{ color: "var(--graphite)", background: "var(--mist)", border: "none" }}
              >
                ← Back to Sign In
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--graphite)" }}>
              Need help?{" "}
              <button onClick={() => setSupportOpen(true)} className="font-semibold hover:opacity-70 transition-opacity cursor-pointer" style={{ color: "var(--graphite)", background: "none", border: "none", padding: 0, textDecoration: "underline" }}>
                Contact support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up shadow-2xl" style={{ background: "var(--paper)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Contact Support</h3>
              <button onClick={() => { setSupportOpen(false); setSupportSent(false); }} type="button"
                className="cursor-pointer p-1 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--graphite)", background: "none", border: "none" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {supportSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(47,214,117,0.12)" }}>
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="var(--signal-green)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Message sent!</p>
                <p className="text-xs mt-1" style={{ color: "var(--graphite)" }}>Our team will respond within 24 hours.</p>
                <button onClick={() => { setSupportOpen(false); setSupportSent(false); }}
                  className="mt-5 w-full py-2.5 text-sm font-semibold rounded-lg cursor-pointer"
                  style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--graphite)" }}>Email</label>
                  <input type="email" required value={supportForm.email || email}
                    onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full text-sm outline-none pb-2 pt-0.5"
                    style={{ color: "var(--ink)", background: "transparent", border: "none", borderBottom: "2px solid var(--mist)" }}
                    onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                    onBlur={(e) => { e.target.style.borderBottomColor = "var(--mist)"; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--graphite)" }}>Subject</label>
                  <input type="text" required value={supportForm.subject}
                    onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="How can we help?"
                    className="w-full text-sm outline-none pb-2 pt-0.5"
                    style={{ color: "var(--ink)", background: "transparent", border: "none", borderBottom: "2px solid var(--mist)" }}
                    onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                    onBlur={(e) => { e.target.style.borderBottomColor = "var(--mist)"; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--graphite)" }}>Message</label>
                  <textarea required rows={3} value={supportForm.message}
                    onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue..."
                    className="w-full text-sm outline-none pb-2 pt-0.5 resize-none"
                    style={{ color: "var(--ink)", background: "transparent", border: "none", borderBottom: "2px solid var(--mist)" }}
                    onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                    onBlur={(e) => { e.target.style.borderBottomColor = "var(--mist)"; }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSupportOpen(false)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg cursor-pointer"
                    style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={supportSending}
                    className="flex-[2] py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                  >
                    {supportSending ? (
                      <span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                    ) : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}