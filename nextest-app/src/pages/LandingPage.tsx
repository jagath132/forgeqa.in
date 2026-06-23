import { useState, useEffect, useRef, useCallback } from "react";
import { Logo } from "../components/ui/Logo";
import { useAppStore } from "../store/useAppStore";
import { Moon, Sun, Check, ArrowRight, ChevronDown, Menu, X, Shield, FileText, Code, Brain, LayoutList, Download, MessageSquare } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

/* ── Data ── */

const CONSOLE_REQUIREMENT = "As a user, I want to reset my password via email so I can regain access when locked out.";

const CONSOLE_OUTPUT = [
  "✓ TC-001: Forgot password link visible on login page ........ passed",
  "✓ TC-002: Email field validates format before submit ........ passed",
  "✓ TC-003: Reset link expires after 15 minutes ............... passed",
  "✓ TC-004: New password meets complexity rules ............... passed",
  "✓ TC-005: Confirmation toast shows on success ............... passed",
];

const STATS = [
  { label: "tests_generated", value: "50,234" },
  { label: "providers", value: "6" },
  { label: "uptime", value: "99.9%" },
];

const PROVIDERS = [
  { name: "OpenAI", color: "#74AA9C" },
  { name: "Anthropic", color: "#CC785C" },
  { name: "Gemini", color: "#8EAAE8" },
  { name: "Groq", color: "#F5A623" },
  { name: "OpenRouter", color: "#7C65C1" },
  { name: "OpenCode", color: "#9AA0AC" },
];

const PIPELINE_STAGES = [
  { step: "01", icon: FileText, title: "Parse requirements", desc: "Drop a PRD, ticket, or plain-text spec. NexTest extracts intent, edge cases, and acceptance criteria automatically." },
  { step: "02", icon: LayoutList, title: "Generate test matrix", desc: "Structured test cases with preconditions, steps, expected results, and priority — mapped to your existing test suite." },
  { step: "03", icon: Code, title: "Export scripts", desc: "One-click export to Selenium, Cypress, Playwright, or your CI pipeline. No manual translation." },
];

const SECONDARY_FEATURES = [
  { icon: Shield, title: "Enterprise-grade security", desc: "AES-256-GCM encrypted API keys. SOC 2 compliant infrastructure. Your data never trains third-party models." },
  { icon: Download, title: "Multi-format export", desc: "PDF, CSV, XLSX, JUnit XML, and direct CI integration." },
  { icon: Brain, title: "Generation history", desc: "Every test case is versioned. Roll back, diff, or replay any generation." },
];

const PRICING_TIERS = [
  { name: "Starter", price: "$29", period: "/month", desc: "For individual QA engineers and small teams.", features: ["500 test generations/mo", "3 AI providers", "CSV & PDF export", "Email support"], cta: "Start Free Trial", highlighted: false },
  { name: "Team", price: "$99", period: "/month", desc: "For growing QA teams with shared test suites.", features: ["5,000 test generations/mo", "All AI providers", "Multi-format export", "Team workspaces", "Priority email support"], cta: "Start Free Trial", highlighted: true },
  { name: "Enterprise", price: "Custom", period: "", desc: "For organizations with custom compliance needs.", features: ["Unlimited generations", "On-premise deployment option", "SSO/SAML", "Dedicated support engineer", "Custom integrations", "SLA guarantee"], cta: "Contact Sales", highlighted: false },
];

const FAQ_ITEMS = [
  { q: "How does NexTest handle my data?", a: "Your requirements and generated test cases are stored in your dedicated MongoDB instance. We never share or sell your data. API keys are encrypted at rest with AES-256-GCM." },
  { q: "Which AI provider sees my data?", a: "The provider you choose. When you bring your own API key (BYOK), requests go directly to that provider — NexTest never proxies through a shared pool. You control exactly which model processes your requirements." },
  { q: "Can I bring my own API key?", a: "Yes — every AI provider supports BYOK. Your key is encrypted and stored securely. You can rotate or revoke it at any time from the settings panel." },
  { q: "What export formats are supported?", a: "PDF, CSV, XLSX, and JUnit XML. Direct CI integrations include GitHub Actions, GitLab CI, and Jenkins via webhook." },
  { q: "What is your cancellation policy?", a: "Cancel anytime. Your data remains accessible for 30 days after cancellation. Annual plans are prorated and refunded for the unused portion." },
  { q: "Is there a free trial?", a: "Yes — all plans include a 14-day free trial with full feature access. No credit card required." },
];

/* ── Components ── */

function ConsoleWidget() {
  const [phase, setPhase] = useState<"typing" | "generating" | "done">("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [visibleOutput, setVisibleOutput] = useState(0);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typedChars < CONSOLE_REQUIREMENT.length) {
      const t = setTimeout(() => setTypedChars((p) => p + 1), 16);
      return () => clearTimeout(t);
    }
    setPhase("generating");
  }, [phase, typedChars]);

  useEffect(() => {
    if (phase !== "generating") return;
    if (visibleOutput < CONSOLE_OUTPUT.length) {
      const t = setTimeout(() => setVisibleOutput((p) => p + 1), 250);
      return () => clearTimeout(t);
    }
    setPhase("done");
  }, [phase, visibleOutput]);

  return (
    <div className="console-widget rounded-xl p-5 overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f5a623" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--signal-green)" }} />
        <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-muted-landing)" }}>nex test —run</span>
      </div>

      {/* Requirement typing */}
      <div className="text-sm font-mono mb-3 leading-relaxed" style={{ color: "var(--text-primary-landing)" }}>
        <span style={{ color: "var(--signal-green)" }}>$</span> nex test generate<span style={{ opacity: 0.4 }}> —provider=gemini</span>
        <br />
        <span className="opacity-40">Reading requirement:</span> {CONSOLE_REQUIREMENT.slice(0, typedChars)}
        {phase === "typing" && <span className="animate-pulse" style={{ color: "var(--signal-green)" }}>▌</span>}
      </div>

      {/* Generated output */}
      {phase !== "typing" && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono mb-2" style={{ color: "var(--signal-green)" }}>
            <span>{">"} Generating test suite</span>
            {phase === "generating" && <span className="animate-pulse">...</span>}
          </div>
          {CONSOLE_OUTPUT.slice(0, visibleOutput).map((line, i) => (
            <div key={i} className="animate-console-line text-xs font-mono" style={{ color: "var(--signal-green)" }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-3 flex gap-6 text-xs font-mono" style={{ borderTop: "1px solid var(--glass-border)" }}>
        {STATS.map((s) => (
          <div key={s.label}>
            <span style={{ color: "var(--text-muted-landing)" }}>$ {s.label}</span>
            <span className="ml-2 font-semibold" style={{ color: "var(--text-primary-landing)" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`scroll-reveal ${visible ? "visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="glass-panel-new rounded-xl overflow-hidden transition-shadow duration-200">
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
              style={{ background: "transparent", border: "none", color: "var(--text-primary-landing)" }}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold">{item.q}</span>
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted-landing)" }} />
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isOpen ? "300px" : "0px" }}
            >
              <div className="px-6 pb-4 text-sm leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
                {item.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ── */

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const user = useAppStore((s) => s.user);
  const isAuthed = user !== null;
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Support form */
  const [supportForm, setSupportForm] = useState({ name: "", email: "", subject: "Technical Support", message: "" });
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportErrors, setSupportErrors] = useState<Record<string, string>>({});

  const validateSupport = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!supportForm.name.trim()) errs.name = "Name is required.";
    if (!supportForm.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportForm.email)) errs.email = "Enter a valid email address.";
    if (supportForm.subject === "Other" && !supportForm.message.trim()) errs.message = "Message is required.";
    return errs;
  }, [supportForm]);

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateSupport();
    setSupportErrors(errs);
    if (Object.keys(errs).length) return;
    setSupportSending(true);
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "62dd773d-d156-48a6-baa0-8264963687ee",
          name: supportForm.name,
          email: supportForm.email,
          subject: supportForm.subject === "Other" ? `Other: ${supportForm.message.slice(0, 60)}` : supportForm.subject,
          message: supportForm.message,
        }),
      });
      setSupportSent(true);
    } catch {
      setSupportSent(true);
    } finally {
      setSupportSending(false);
    }
  }

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Ambient orbs behind hero only ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.15] dark:opacity-[0.15]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", top: "-15%", left: "-5%", filter: "blur(100px)" }}
        />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.12] dark:opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #2FD675 0%, transparent 70%)", bottom: "10%", right: "-5%", filter: "blur(100px)" }}
        />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.08] dark:opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #f5a623 0%, transparent 70%)", top: "40%", left: "50%", filter: "blur(80px)" }}
        />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50"
        style={{
          background: theme === "dark" ? "rgba(10,14,23,0.8)" : "rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px) saturate(1.5)",
          WebkitBackdropFilter: "blur(16px) saturate(1.5)",
          borderBottom: "1px solid var(--glass-border)",
          boxShadow: theme === "dark" ? "0 1px 3px 0 rgba(0,0,0,0.2)" : "0 1px 3px 0 rgba(0,0,0,0.04)",
          transition: "box-shadow 200ms ease-out",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-14">
          <div className="flex items-center gap-8">
            <Logo variant="wordmark" />
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href}
                  className="px-3.5 py-2 text-sm font-medium rounded-lg no-underline transition-all duration-150"
                  style={{ color: "var(--text-muted-landing)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleTheme} type="button"
              className="flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer"
              style={{ width: 34, height: 34, color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthed ? (
              <button onClick={onGetStarted} type="button"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: "#fff", background: "var(--signal-green)", border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button onClick={onSignIn} type="button"
                  className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
                >
                  Sign In
                </button>
                <button onClick={onGetStarted} type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: "#fff", background: "var(--signal-green)", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} type="button"
              className="md:hidden flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer"
              style={{ width: 34, height: 34, color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t animate-fade-in" style={{ borderColor: "var(--glass-border)" }}>
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium px-3 py-2.5 rounded-lg no-underline transition-all duration-150"
                  style={{ color: "var(--text-muted-landing)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="px-6 pb-4 space-y-2">
              {isAuthed ? (
                <button onClick={onGetStarted} type="button"
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-all duration-150"
                  style={{ color: "#fff", background: "var(--signal-green)", border: "none" }}
                >
                  Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button onClick={onSignIn} type="button"
                    className="w-full text-sm font-medium py-2.5 rounded-lg transition-all duration-150"
                    style={{ color: "var(--text-muted-landing)", background: "transparent", border: "1px solid var(--glass-border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.borderColor = "var(--text-muted-landing)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                  >
                    Sign In
                  </button>
                  <button onClick={onGetStarted} type="button"
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-all duration-150"
                    style={{ color: "#fff", background: "var(--signal-green)", border: "none" }}
                  >
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 lg:px-10 lg:pt-28" style={{ paddingBottom: "var(--section-spacing)" }}>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              <span className="gradient-shift">Ship with confidence</span>
            </h1>
            <p className="mt-4 text-lg max-w-lg leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
              Turn product requirements into structured test cases and executable scripts — powered by the AI provider you already trust.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {isAuthed ? (
                <button onClick={onGetStarted} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "var(--bg-base)", background: "var(--text-primary-landing)", border: "none" }}>
                  Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={onGetStarted} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "var(--bg-base)", background: "var(--text-primary-landing)", border: "none" }}>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={onSignIn} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "var(--text-primary-landing)", background: "transparent", border: "1px solid var(--glass-border)" }}>
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
          <div>
            <ConsoleWidget />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "var(--section-spacing)" }}>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50 transition-opacity hover:opacity-80">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted-landing)" }}>Supported providers</span>
          {PROVIDERS.map((p) => (
            <span key={p.name} className="text-sm font-semibold transition-all hover:opacity-100" style={{ color: "var(--text-muted-landing)" }}>
              {p.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Capabilities Pipeline ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "var(--section-spacing)" }}>
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(47,214,117,0.1)", color: "var(--signal-green)", border: "1px solid rgba(47,214,117,0.2)" }}>
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              From spec to test suite in three steps
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-base" style={{ color: "var(--text-muted-landing)" }}>
              Drop in a requirement. Let AI generate the coverage. Export to your framework.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          {PIPELINE_STAGES.map((stage, i) => (
            <ScrollReveal key={stage.step} delay={i * 150}>
              <div className="glass-panel-new rounded-xl p-6 lg:p-8 h-full flex flex-col transition-all duration-200 hover:border-opacity-40" style={{ borderColor: "var(--glass-border)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--signal-green)" }}>{stage.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(47,214,117,0.1)" }}>
                    <stage.icon className="w-5 h-5" style={{ color: "var(--signal-green)" }} />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>{stage.title}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-muted-landing)" }}>{stage.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Secondary features */}
        <div className="grid sm:grid-cols-3 gap-5 mt-8 items-stretch">
          {SECONDARY_FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i + 3) * 150}>
              <div className="flex items-start gap-3 p-4 rounded-lg h-full" style={{ background: "var(--bg-elevated)" }}>
                <f.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--text-muted-landing)" }} />
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary-landing)" }}>{f.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>{f.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>



      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "var(--section-spacing)" }}>
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(47,214,117,0.1)", color: "var(--signal-green)", border: "1px solid rgba(47,214,117,0.2)" }}>
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Plans that scale with your team
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-5 lg:gap-8 max-w-5xl mx-auto items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <ScrollReveal key={tier.name} delay={i * 150}>
              <div className={`rounded-xl p-6 lg:p-8 flex flex-col ${tier.highlighted ? "relative" : ""}`}
                style={{
                  background: tier.highlighted ? "var(--bg-elevated)" : "var(--glass-bg)",
                  border: tier.highlighted ? "1px solid var(--signal-green)" : "1px solid var(--glass-border)",
                }}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "var(--signal-green)", color: "#fff" }}>
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-primary-landing)" }}>{tier.price}</span>
                  {tier.period && <span className="text-sm" style={{ color: "var(--text-muted-landing)" }}>{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted-landing)" }}>{tier.desc}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--signal-green)" }} />
                      <span style={{ color: "var(--text-muted-landing)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} type="button" className="mt-8 w-full py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  style={{
                    color: tier.highlighted ? "var(--bg-base)" : "var(--signal-green)",
                    background: tier.highlighted ? "var(--signal-green)" : "transparent",
                    border: tier.highlighted ? "none" : "1px solid var(--signal-green)",
                  }}
                >
                  {isAuthed && tier.name !== "Enterprise" ? "Dashboard" : tier.cta}
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "var(--section-spacing)" }}>
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(47,214,117,0.1)", color: "var(--signal-green)", border: "1px solid rgba(47,214,117,0.2)" }}>
              <MessageSquare className="w-3 h-3" /> FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Questions? Answered.
            </h2>
          </div>
        </ScrollReveal>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>



      {/* ── Contact form ── */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "var(--section-spacing)" }}>
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(47,214,117,0.1)", color: "var(--signal-green)", border: "1px solid rgba(47,214,117,0.2)" }}>
              <MessageSquare className="w-3 h-3" /> Contact
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Get in touch
            </h2>
            <p className="mt-3 text-base" style={{ color: "var(--text-muted-landing)" }}>
              Have a question or issue? We are here to help.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {supportSent ? (
            <div className="glass-panel-new rounded-2xl p-12 text-center max-w-lg mx-auto">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5" style={{ background: "rgba(47,214,117,0.1)" }}>
                <Check className="w-8 h-8" style={{ color: "var(--signal-green)" }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary-landing)" }}>Message sent!</h3>
              <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--text-muted-landing)" }}>Thank you for reaching out. Our team will respond within 24 hours.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>Let's talk</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
                    Fill in the details and we'll get back to you within 24 hours.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: "rgba(47,214,117,0.1)" }}>
                      <MessageSquare className="w-4 h-4" style={{ color: "var(--signal-green)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary-landing)" }}>Email us</p>
                      <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>hello@nextest.app</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: "rgba(47,214,117,0.1)" }}>
                      <svg className="w-4 h-4" style={{ color: "var(--signal-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary-landing)" }}>Response time</p>
                      <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>Typically within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSupportSubmit} className="glass-panel-new rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="support-name" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Name</label>
                    <input id="support-name" type="text" required value={supportForm.name} onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe"
                      className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: supportErrors.name ? "2px solid var(--signal-amber)" : "2px solid var(--glass-border)" }}
                      onFocus={(e) => { if (!supportErrors.name) e.target.style.borderColor = "var(--signal-green)"; }}
                      onBlur={(e) => { if (!supportErrors.name) e.target.style.borderColor = "var(--glass-border)"; }}
                    />
                    {supportErrors.name && <p className="mt-1 text-xs" style={{ color: "var(--signal-amber)" }}>{supportErrors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="support-email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Email</label>
                    <input id="support-email" type="email" required value={supportForm.email} onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com"
                      className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: supportErrors.email ? "2px solid var(--signal-amber)" : "2px solid var(--glass-border)" }}
                      onFocus={(e) => { if (!supportErrors.email) e.target.style.borderColor = "var(--signal-green)"; }}
                      onBlur={(e) => { if (!supportErrors.email) e.target.style.borderColor = "var(--glass-border)"; }}
                    />
                    {supportErrors.email && <p className="mt-1 text-xs" style={{ color: "var(--signal-amber)" }}>{supportErrors.email}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="support-subject" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Subject</label>
                  <select id="support-subject" value={supportForm.subject} onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                    style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: "2px solid var(--glass-border)" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--signal-green)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--glass-border)"; }}
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Sales">Sales</option>
                    <option value="Billing">Billing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {supportForm.subject === "Other" && (
                  <div>
                    <label htmlFor="support-subject-text" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Subject (free text)</label>
                    <input id="support-subject-text" type="text" required value={supportForm.message.split(" ").slice(0, 8).join(" ")} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} placeholder="Brief subject line"
                      className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: "2px solid var(--glass-border)" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--signal-green)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--glass-border)"; }}
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="support-message" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Message</label>
                  <textarea id="support-message" required rows={4} value={supportForm.message} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} placeholder="Tell us more about your question or issue..."
                    className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg resize-y"
                    style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: supportErrors.message ? "2px solid var(--signal-amber)" : "2px solid var(--glass-border)" }}
                    onFocus={(e) => { if (!supportErrors.message) e.target.style.borderColor = "var(--signal-green)"; }}
                    onBlur={(e) => { if (!supportErrors.message) e.target.style.borderColor = "var(--glass-border)"; }}
                  />
                  <div className="flex justify-between mt-1">
                    {supportErrors.message ? <p className="text-xs" style={{ color: "var(--signal-amber)" }}>{supportErrors.message}</p> : <span />}
                    <span className="text-xs" style={{ color: "var(--text-muted-landing)" }}>{supportForm.message.length}/2000</span>
                  </div>
                </div>
                <button type="submit" disabled={supportSending}
                  className="w-full py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ color: "var(--bg-base)", background: "var(--signal-green)", border: "none" }}
                >
                  {supportSending ? (
                    <span className="h-4 w-4 rounded-full border-2 border-[var(--bg-base)] border-t-transparent animate-spin" />
                  ) : (
                    <><MessageSquare className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingTop: "var(--section-spacing)", paddingBottom: "var(--section-spacing)" }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Logo variant="wordmark" />
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
                AI-powered QA automation for teams that ship with confidence.
              </p>
            </div>
            {/* Link columns */}
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog"] },
              { title: "Company", links: ["About", "Blog"] },
              { title: "Resources", links: ["Docs", "API Reference", "Status"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted-landing)" }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm no-underline transition-opacity hover:opacity-70" style={{ color: "var(--text-primary-landing)" }}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Bottom */}
          <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>&copy; {new Date().getFullYear()} NexTest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
