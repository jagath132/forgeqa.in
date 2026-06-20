import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { api, type AuthResponse } from "../lib/api";
import { useAppStore } from "../store/useAppStore";

type Step = "info" | "plan" | "payment" | "pending_verification" | "verify_key";

type PlanData = {
  id: string; name: string; price: number; currency: string; period: string;
  description: string; features: string[]; popular: boolean; active: boolean;
};

const STEP_LABELS: { key: Step; label: string; icon: string }[] = [
  { key: "info", label: "Account", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "plan", label: "Plan", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { key: "payment", label: "Payment", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { key: "pending_verification", label: "Verification", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { key: "verify_key", label: "Activate", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
];

function Field({ label, id, type, value, onChange, placeholder, icon, children }: {
  label: string; id: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <div className="relative">
      <div className="relative rounded-xl transition-all duration-200"
        style={{ background: "var(--bg-tertiary)", border: `1px solid ${focused ? "var(--accent)" : "var(--border-default)"}`, boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none" }}
        onClick={() => ref.current?.focus()}
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none" style={{ color: floating ? "var(--accent)" : "var(--text-muted)", transition: "color 0.2s" }}>
          {icon}
        </div>
        <input ref={ref} id={id} type={type} value={value} placeholder={floating ? placeholder : ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none pt-4 pb-1.5 pl-10 pr-3 text-sm" style={{ color: "var(--text-primary)" }}
        />
        <label htmlFor={id}
          className="absolute left-10 pointer-events-none text-sm transition-all duration-200"
          style={{
            color: floating ? "var(--accent)" : "var(--text-muted)",
            top: floating ? "0.3rem" : "50%",
            fontSize: floating ? "0.7rem" : "0.875rem",
            transform: floating ? "translateY(0)" : "translateY(-50%)",
            transformOrigin: "left center",
          }}
        >
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const setUser = useAppStore((s) => s.setUser);
  const setSavedProviderKeys = useAppStore((s) => s.setSavedProviderKeys);

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
    if (keyParam) setProductKey(keyParam);
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
          setProductKey(res.data.productKey);
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
      const res = await api.post<AuthResponse>("/api/auth/complete-registration", { email, productKey });
      setUser(res.data.user);
      try {
        const keysRes = await api.get<{ keys: Record<string, boolean> }>("/api/settings/api-keys");
        setSavedProviderKeys(keysRes.data.keys ?? {});
      } catch { /* ignore */ }
      navigate("/dashboard");
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

  const currentStepIdx = STEP_LABELS.findIndex((s) => s.key === step);
  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);
  const isFreePlan = selectedPlanObj ? selectedPlanObj.price === 0 : false;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] sm:h-[700px] sm:w-[700px] rounded-full opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, var(--accent-violet), transparent)", filter: "blur(120px)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] sm:h-[700px] sm:w-[700px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(circle, var(--accent-cyan), transparent)", filter: "blur(120px)" }} />

      <div className="relative w-full" style={{ maxWidth: step === "plan" ? 820 : step === "payment" ? 520 : 480 }}>

        {/* Back to Home */}
        <button onClick={() => navigate("/")} type="button"
          className="flex items-center gap-1.5 text-xs font-semibold mb-5 transition-all hover:gap-2"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Steps indicator */}
        <div className="flex items-center mb-8 overflow-x-auto py-1">
          {STEP_LABELS.map((s, i) => {
            const active = step === s.key;
            const done = currentStepIdx > i;
            if (s.key === "payment" && isFreePlan) return null;

            return (
              <div key={s.key} className="flex items-center shrink-0">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-all duration-300"
                    style={{
                      background: done ? "var(--success)" : active ? "var(--accent)" : "var(--bg-tertiary)",
                      color: active || done ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {done ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold hidden sm:inline transition-colors duration-300"
                    style={{ color: active ? "var(--accent)" : done ? "var(--success)" : "var(--text-muted)" }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && !(s.key === "plan" && isFreePlan) && (
                  <div className="w-4 sm:w-8 h-px mx-1 transition-colors duration-300" style={{ background: done ? "var(--success)" : "var(--border-default)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8 animate-fade-in border"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "var(--border-default)",
            boxShadow: "0 12px 50px rgba(0,0,0,0.35)"
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "var(--accent-gradient)", boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 3L22 3L22 14L12 22L2 14Z" />
                <path d="M18 5 L12 11" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {step === "info" && "Create your account"}
              {step === "plan" && "Choose your plan"}
              {step === "payment" && "Confirm payment"}
              {step === "pending_verification" && "Verification in progress"}
              {step === "verify_key" && "Activate your account"}
            </h1>
            <p className="text-xs sm:text-sm mt-1.5 max-w-xs" style={{ color: "var(--text-muted)" }}>
              {step === "info" && "Enter your details to get started with NexTest."}
              {step === "plan" && "Select a plan tailored to your team. Upgrade anytime."}
              {step === "payment" && `Subscribe to the ${selectedPlan?.toUpperCase()} tier to continue.`}
              {step === "pending_verification" && "Waiting for License Manager verification."}
              {step === "verify_key" && "Enter the product key sent to your email."}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm animate-shake" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ACCOUNT INFO */}
          {step === "info" && (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <Field label="Full Name" id="name" type="text" value={name} onChange={setName} placeholder="John Doe"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
              />
              <Field label="Email address" id="email" type="email" value={email} onChange={setEmail} placeholder="name@company.com"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
              />
              <Field label="Password" id="password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="Create a password"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>}
              >
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </Field>

              {password.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(strength.score / 5) * 100}%`, background: colorScale[strength.score] }} />
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: colorScale[strength.score] }}>{strength.label}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading || strength.score < 2}
                className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all"
                style={{ background: "var(--gradient-rainbow)" }}
              >
                {isLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg></>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PLANS */}
          {step === "plan" && (
            <div className="space-y-6">
              {plansLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => {
                    const active = selectedPlan === plan.id;
                    const displayPrice = plan.price === 0 ? "$0" : "$" + (plan.price / 100);
                    const displayPeriod = plan.period === "forever" ? "forever" : "/" + (plan.period === "monthly" ? "month" : plan.period === "yearly" ? "year" : plan.period);
                    return (
                      <div key={plan.id}
                        className="relative flex flex-col rounded-xl border-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: active ? "var(--accent-soft)" : "var(--bg-card-hover)",
                          borderColor: active ? "var(--accent)" : "var(--border-default)",
                          boxShadow: active ? "0 0 24px rgba(99,102,241,0.15)" : "none",
                          opacity: isLoading && !active ? 0.5 : 1,
                        }}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap z-10" style={{ background: "var(--gradient-rainbow)", color: "#fff" }}>
                            Most Popular
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                          <div className="mt-2 flex items-baseline gap-0.5">
                            <span className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{displayPrice}</span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{displayPeriod}</span>
                          </div>
                          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{plan.description}</p>
                          <div className="w-full h-px my-4" style={{ background: "var(--border-subtle)" }} />
                          <ul className="space-y-2 flex-1">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: active ? "var(--accent)" : "var(--accent-emerald)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </li>
                            ))}
                          </ul>
                          <button type="button" className="w-full mt-5 py-2 text-xs font-bold rounded-lg transition-all"
                            style={{
                              background: active ? "var(--gradient-rainbow)" : "transparent",
                              color: active ? "#fff" : "var(--text-primary)",
                              border: `1px solid ${active ? "transparent" : "var(--border-default)"}`,
                            }}
                          >
                            {active ? "Selected" : "Choose " + plan.name}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => { setStep("info"); setError(""); }}
                className="btn-secondary w-full py-2.5 text-sm font-semibold rounded-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Back
              </button>
            </div>
          )}

          {/* STEP 3: STRIPE CHECKOUT */}
          {step === "payment" && selectedPlanObj && (
            <div className="space-y-5">
              <div className="rounded-xl p-5" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Plan</span>
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg tracking-widest"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    {selectedPlanObj.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Amount due today</span>
                  <span className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                    ${selectedPlanObj.price / 100}
                    <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                      {selectedPlanObj.period === "monthly" ? "/mo" : selectedPlanObj.period === "yearly" ? "/yr" : ""}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Billing cycle</span>
                  <span>{selectedPlanObj.period === "monthly" ? "Monthly subscription" : selectedPlanObj.period === "yearly" ? "Yearly subscription" : "One-time"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl p-4" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <svg className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Secured by <strong style={{ color: "var(--text-primary)" }}>Stripe</strong>. Your card details never touch our servers.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button onClick={() => { setStep("plan"); setError(""); }}
                  className="btn-secondary py-3 text-sm font-semibold rounded-xl flex-1"
                  disabled={paymentProcessing}
                >
                  Back
                </button>
                <button onClick={handleStripeCheckout} disabled={paymentProcessing}
                  className="btn-primary py-3 text-sm font-semibold rounded-xl flex-[2] flex items-center justify-center gap-2"
                  style={{ background: "var(--gradient-rainbow)" }}
                >
                  {paymentProcessing ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Redirecting to Stripe...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125V9M17.25 6v9" /></svg>
                    Pay with Stripe</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PENDING VERIFICATION */}
          {step === "pending_verification" && (
            <div className="text-center space-y-6 py-4">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full" style={{ border: "3px solid var(--border-default)", opacity: 0.3 }} />
                <div className="absolute inset-0 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent", borderWidth: 3 }} />
                <svg className="w-8 h-8" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Verification pending</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Your request has been submitted. We will verify your account and email a product key to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                <span className="h-2 w-2 rounded-full bg-current animate-ping" />
                Auto-checking status every 4s
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button onClick={() => setStep("verify_key")}
                  className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl"
                >
                  I Already Have a Product Key
                </button>
                <button onClick={() => navigate("/auth")}
                  className="btn-secondary w-full py-2.5 text-sm font-semibold rounded-xl"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ACTIVATE WITH PRODUCT KEY */}
          {step === "verify_key" && (
            <form onSubmit={handleKeySubmit} className="space-y-5">
              <Field label="Email address" id="emailVerify" type="email" value={email} onChange={setEmail}
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
              />

              <div>
                <div className="relative">
                  <div className="relative rounded-xl transition-all duration-200"
                    style={{ background: "var(--bg-tertiary)", border: `1px solid ${productKey.length === 29 ? "var(--success)" : "var(--border-default)"}` }}
                  >
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none" style={{ color: productKey.length === 29 ? "var(--success)" : "var(--text-muted)" }}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                    </div>
                    <input id="productKeyInput" type="text" required placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29}
                      value={productKey} onChange={(e) => setProductKey(formatKey(e.target.value))}
                      className="w-full bg-transparent outline-none py-3 pl-10 pr-10 text-sm tracking-[0.15em] font-mono"
                      style={{ color: "var(--text-primary)" }}
                      onFocus={(e) => e.currentTarget.parentElement!.style.borderColor = "var(--accent)"}
                      onBlur={(e) => e.currentTarget.parentElement!.style.borderColor = productKey.length === 29 ? "var(--success)" : "var(--border-default)"}
                    />
                    {productKey.length === 29 && (
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" style={{ color: "var(--success)" }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Enter the product key you received via email. Format: <span className="font-mono">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button type="button" onClick={() => setStep("pending_verification")}
                  className="btn-secondary py-2.5 text-sm font-semibold rounded-xl flex-1"
                >
                  Back
                </button>
                <button type="submit" disabled={isLoading || productKey.length < 29}
                  className="btn-primary py-2.5 text-sm font-semibold rounded-xl flex-[2] flex items-center justify-center gap-2"
                  style={{ background: "var(--gradient-rainbow)" }}
                >
                  {isLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>Activate Account <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <button onClick={() => navigate("/auth")} className="font-semibold hover:opacity-75 transition-opacity" style={{ color: "var(--accent)" }}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
