import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { api } from "../lib/api";

type Step = "info" | "plan" | "payment" | "pending_verification" | "verify_key";

type PlanData = {
  id: string; name: string; price: number; currency: string; period: string;
  description: string; features: string[]; popular: boolean; active: boolean;
};

const CONSOLE_LINES = [
  "✓ setup pipeline .................. running",
  "✓ environment ..................... 0.2s",
  "✓ dependency check ................ ok",
  "✓ test suite (12/12) .............. passed",
  "✓ api contract .................... verified",
  "✓ db connection ................... 4ms",
  "✓ cache invalidation .............. ok",
  "✓ auth middleware ................. passed",
  "✓ rate limiter .................... 2ms",
  "✓ input sanitization .............. clean",
  "✓ response format ................. valid",
  "✓ ssl handshake ................... 12ms",
  "✓ csrf check ...................... passed",
  "✓ cors policy ..................... valid",
  "✓ session store ................... ok",
  "✓ request validation .............. passed",
  "✓ permission check ................ ok",
  "✓ audit log ....................... written",
  "✓ running suite (12/12) ........... ",
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

const STEP_ORDER: Step[] = ["info", "plan", "payment", "pending_verification", "verify_key"];

const STEP_LABELS: Record<Step, string> = {
  info: "Account details",
  plan: "Choose a plan",
  payment: "Payment",
  pending_verification: "Verification",
  verify_key: "Activate",
};

function UnderlineInput({ label, id, type, value, onChange, placeholder, className, autoComplete, children }: {
  label: string; id: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; className?: string; autoComplete?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>{label}</label>
      <div className="relative">
        <input id={id} type={type} required value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
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
        {children}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();



  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [productKey, setProductKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    api.get<{ plans: PlanData[] }>("/api/plans").then((res) => {
      setPlans(res.data.plans);
      setPlansLoading(false);
    }).catch(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const keyParam = searchParams.get("key");
    const stepParam = searchParams.get("step");
    const pendingIdParam = searchParams.get("pendingId");

    if (emailParam) setEmail(emailParam);
    if (pendingIdParam) setPendingId(pendingIdParam);
    if (stepParam === "verify_key" || keyParam) {
      setStep("verify_key");
    } else if (stepParam === "pending_verification") {
      setStep("pending_verification");
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "pending_verification" || !email) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = undefined;
      }
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get<{ status: string; productKey: string | null }>(
          `/api/auth/registration-status?email=${encodeURIComponent(email)}`
        );
        if (res.data.status === "ready" && res.data.productKey) {
          setStep("verify_key");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = undefined;
          }
        }
      } catch {
        // Suppress errors during polling
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [step, email]);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "" };
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return { score, label: score >= 4 ? "Strong" : score >= 2 ? "Medium" : "Weak" };
  };

  const strength = getPasswordStrength(password);
  const colorScale = ["", "var(--danger)", "var(--warning)", "var(--warning)", "var(--success)", "var(--success)"];

  async function handleInfoSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/start-registration", { name, email, password });
      setPendingId(res.data.pendingId);
      setStep("plan");
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration initiation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlanSelect(planId: string) {
    if (!pendingId) return;
    setSelectedPlan(planId);
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post<{ status: string }>("/api/auth/select-plan", { pendingId, plan: planId });
      if (res.data.status === "pending_verification") {
        setStep("pending_verification");
      } else {
        setStep("payment");
      }
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Something went wrong. Please try again.");
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStripeCheckout() {
    if (!pendingId || !selectedPlan) return;
    setError("");
    setPaymentProcessing(true);
    try {
      const res = await api.post<{ url: string }>("/api/payments/create-checkout", {
        pendingId, plan: selectedPlan, email,
      });
      window.location.href = res.data.url;
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : err instanceof Error ? err.message : "Failed to initiate payment";
      setError(message);
      setPaymentProcessing(false);
    }
  }

  async function handleKeySubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post("/api/auth/complete-registration", { email, productKey });
      navigate("/auth");
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to complete registration with this key.");
    } finally {
      setIsLoading(false);
    }
  }

  const formatKey = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const groups = [];
    for (let i = 0; i < cleaned.length && groups.length < 5; i += 5) {
      groups.push(cleaned.slice(i, i + 5));
    }
    return groups.join("-");
  };

  const isFreePlan = (() => {
    const planObj = plans.find((p) => p.id === selectedPlan);
    return planObj ? planObj.price === 0 : false;
  })();

  const visibleSteps = (() => {
    if (isFreePlan) return ["info", "plan", "pending_verification", "verify_key"] as Step[];
    return STEP_ORDER;
  })();

  const currentStepIdx = visibleSteps.indexOf(step);
  const totalSteps = visibleSteps.length;

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
            Create your<br />account
          </h1>
          <p className="text-base max-w-sm" style={{ color: "rgba(247,248,246,0.55)", fontFamily: "var(--font-sans)" }}>
            Set up your team in minutes and start shipping with confidence.
          </p>

          {/* Console feed */}
          <div className="mt-12" style={{ fontFamily: "var(--font-mono)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--signal-green)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(47,214,117,0.5)" }}>Setup Runner</span>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <ConsoleFeed />
            </div>
          </div>
        </div>

        {/* Bottom subtle branding */}
        <div className="px-10 pb-8">
          <p className="text-xs" style={{ color: "rgba(247,248,246,0.2)", fontFamily: "var(--font-mono)" }}>
            $ nex setup —team={email || "team"} —reporter=spec
          </p>
        </div>
      </div>

      {/* Right panel — registration form */}
      <div className="w-full md:w-[45%] flex items-center justify-center px-6 py-10 md:py-0" style={{ background: "var(--paper)" }}>
        <div className="w-full max-w-sm">
          {/* Toggle */}
          <div className="flex p-0.5 mb-8 rounded-lg" style={{ background: "var(--mist)", border: "1px solid var(--mist)" }}>
            {(["register", "login"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => t === "login" ? navigate("/auth") : undefined}
                className="flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer"
                style={{
                  background: t === "register" ? "var(--ink)" : "transparent",
                  color: t === "register" ? "var(--paper)" : "var(--graphite)",
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

          {/* Step progress */}
          {step !== "pending_verification" && (
            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--graphite)" }}>
                  Step {currentStepIdx + 1} of {totalSteps}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{STEP_LABELS[step]}</span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--mist)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%`, background: "var(--signal-green)" }} />
              </div>
            </div>
          )}

          {/* STEP 1: ACCOUNT INFO */}
          {step === "info" && (
            <form onSubmit={handleInfoSubmit} autoComplete="off" className="space-y-5">
              <UnderlineInput label="Full Name" id="reg_name" type="text" value={name} onChange={setName} placeholder="John Doe" />
              <UnderlineInput label="Email address" id="reg_email" type="email" value={email} onChange={setEmail} placeholder="name@company.com" />
              <UnderlineInput label="Password" id="reg_password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="Create a password" autoComplete="new-password">
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
              </UnderlineInput>

              {password.length > 0 && (
                <div className="flex items-center gap-3 px-0.5">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--mist)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(strength.score / 5) * 100}%`, background: colorScale[strength.score] }} />
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: colorScale[strength.score] }}>{strength.label}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading || strength.score < 2}
                className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
              >
                {isLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                ) : (
                  <>Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg></>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PLANS */}
          {step === "plan" && (
            <div className="space-y-5 animate-fade-in">
              {plansLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--ink)", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <div className="grid gap-3">
                  {plans.map((plan) => {
                    const active = selectedPlan === plan.id;
                    const displayPrice = plan.price === 0 ? "$0" : "$" + (plan.price / 100);
                    const displayPeriod = plan.period === "forever" ? "forever" : "/" + (plan.period === "monthly" ? "month" : plan.period === "yearly" ? "year" : plan.period);
                    return (
                      <div key={plan.id}
                        className="relative rounded-lg cursor-pointer transition-all duration-200 p-4"
                        style={{
                          background: active ? "rgba(47,214,117,0.06)" : "transparent",
                          border: `1px solid ${active ? "var(--signal-green)" : "var(--mist)"}`,
                        }}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest" style={{ background: "var(--signal-green)", color: "var(--ink)" }}>
                            Most Popular
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-bold" style={{ color: "var(--ink)" }}>{plan.name}</h3>
                            <div className="mt-1 flex items-baseline gap-0.5">
                              <span className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>{displayPrice}</span>
                              <span className="text-xs" style={{ color: "var(--graphite)" }}>{displayPeriod}</span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--graphite)" }}>{plan.description}</p>
                          </div>
                          {active && (
                            <svg className="w-5 h-5 shrink-0" style={{ color: "var(--signal-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        {plan.features.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            {plan.features.map((f) => (
                              <span key={f} className="flex items-center gap-1 text-xs" style={{ color: "var(--graphite)" }}>
                                <svg className="w-3 h-3 shrink-0" style={{ color: "var(--signal-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => { setStep("info"); setError(""); }}
                className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
              >
                ← Back
              </button>
            </div>
          )}

          {/* STEP 3: STRIPE CHECKOUT */}
          {step === "payment" && (
            <div className="space-y-5 animate-fade-in">
              {(() => {
                const planObj = plans.find((p) => p.id === selectedPlan);
                if (!planObj) return null;
                return (
                  <>
                    <div className="rounded-lg p-4" style={{ background: "var(--mist)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--graphite)" }}>Plan</span>
                        <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded" style={{ background: "rgba(47,214,117,0.15)", color: "var(--signal-green)" }}>
                          {planObj.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pb-3" style={{ borderBottom: "1px solid var(--mist)" }}>
                        <span className="text-sm" style={{ color: "var(--graphite)" }}>Amount due today</span>
                        <span className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
                          ${planObj.price / 100}
                          <span className="text-xs font-normal" style={{ color: "var(--graphite)" }}>
                            {planObj.period === "monthly" ? "/mo" : planObj.period === "yearly" ? "/yr" : ""}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: "var(--graphite)" }}>
                        <span>Billing cycle</span>
                        <span>{planObj.period === "monthly" ? "Monthly subscription" : planObj.period === "yearly" ? "Yearly subscription" : "One-time"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-xs" style={{ background: "rgba(47,214,117,0.06)", border: "1px solid rgba(47,214,117,0.15)" }}>
                      <svg className="w-4 h-4 shrink-0" style={{ color: "var(--signal-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <span style={{ color: "var(--graphite)" }}>Secured by <strong style={{ color: "var(--ink)" }}>Stripe</strong>. Your card details never touch our servers.</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => { setStep("plan"); setError(""); }}
                        className="py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer flex-1"
                        style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
                        disabled={paymentProcessing}
                      >
                        Back
                      </button>
                      <button onClick={handleStripeCheckout} disabled={paymentProcessing}
                        className="py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 flex-[2] cursor-pointer"
                        style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                      >
                        {paymentProcessing ? (
                          <><span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" /> Redirecting to Stripe...</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125V9M17.25 6v9" /></svg>
                          Pay with Stripe</>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* STEP 4: PENDING VERIFICATION */}
          {step === "pending_verification" && (
            <div className="text-center space-y-6 py-6 animate-fade-in">
              <div className="flex justify-center">
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: "3px solid var(--mist)",
                  borderTopColor: "var(--signal-green)",
                  animation: "spin 1.2s cubic-bezier(0.6, 0, 0.4, 1) infinite",
                }} />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Verification pending</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: "var(--graphite)" }}>
                  Your request has been submitted. We will verify your account and email a product key to <strong style={{ color: "var(--ink)" }}>{email}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 rounded-lg px-4 py-3 text-xs" style={{ background: "rgba(47,214,117,0.06)", border: "1px solid rgba(47,214,117,0.15)", color: "var(--signal-green)" }}>
                <span className="h-2 w-2 rounded-full bg-current animate-ping" />
                Auto-checking every 4s
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button onClick={() => setStep("verify_key")}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                >
                  I Already Have a Product Key
                </button>
                <button onClick={() => navigate("/auth")}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ACTIVATE WITH PRODUCT KEY */}
          {step === "verify_key" && (
            <form onSubmit={handleKeySubmit} autoComplete="off" className="space-y-5 animate-fade-in">
              <UnderlineInput label="Email address" id="emailVerify" type="email" value={email} onChange={setEmail} />

              <div>
                <label htmlFor="productKeyInput" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--graphite)" }}>Product Key</label>
                <div className="relative">
                  <input id="productKeyInput" type="text" required placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29}
                    value={productKey} onChange={(e) => setProductKey(formatKey(e.target.value))}
                    className="w-full tracking-[0.15em] font-mono outline-none transition-all pb-2 pt-0.5 pr-8 text-sm"
                    style={{
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${productKey.length === 29 ? "var(--signal-green)" : "var(--mist)"}`,
                    }}
                    onFocus={(e) => { e.target.style.borderBottomColor = "var(--signal-green)"; }}
                    onBlur={(e) => { e.target.style.borderBottomColor = productKey.length === 29 ? "var(--signal-green)" : "var(--mist)"; }}
                  />
                  {productKey.length === 29 && (
                    <span className="absolute right-0 top-0 pointer-events-none" style={{ color: "var(--signal-green)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--graphite)" }}>
                  Enter the product key you received via email. Format: <span className="font-mono">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setStep("pending_verification")}
                  className="py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer flex-1"
                  style={{ background: "transparent", color: "var(--graphite)", border: "1px solid var(--mist)" }}
                >
                  Back
                </button>
                <button type="submit" disabled={isLoading || productKey.length < 29}
                  className="py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 flex-[2] cursor-pointer"
                  style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
                >
                  {isLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                  ) : (
                    <>Activate Account <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg></>
                  )}
                </button>
              </div>
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
