import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../components/ui/Logo";
import { useAppStore } from "../store/useAppStore";
import { Moon, Sun, ArrowRight, ChevronDown, Menu, X, Shield, FileText, Code, LayoutList, Download, MessageSquare, Check } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

/* ── Data ── */

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

const FEATURE_ROWS = [
  { id: "TC-001", label: "Manual test case writing", outcome: "AI-generated test matrix", metric: "Hours saved per sprint", status: "Pass" as const },
  { id: "TC-002", label: "Tribal knowledge of edge cases", outcome: "AI-surfaced edge cases", metric: "Coverage you didn't know you were missing", status: "Pass" as const },
  { id: "TC-003", label: "Manual script translation", outcome: "One-click export to Selenium/Cypress/Playwright", metric: "Zero copy-paste", status: "Pass" as const },
  { id: "TC-004", label: "Untracked test suite changes", outcome: "Versioned generation history", metric: "Full audit trail", status: "Pass" as const },
];

const FEATURE_DIFF_EXAMPLE = {
  requirement: "As a user, I want to reset my password via email so I can regain access when locked out.",
  highlight: "reset my password via email",
  testCase: { id: "TC-001", title: "Forgot password link visible on login page", status: "Pass" as const },
};

const PERSONA_EXAMPLES = {
  fresher: {
    requirement: "As a user, I want to log in with my email and password.",
    highlight: "log in with my email and password",
    testCases: [
      { id: "TC-001", title: "Valid credentials redirect to dashboard", status: "Pass" as const },
      { id: "TC-002", title: "Invalid email shows inline error", status: "Pass" as const },
      { id: "TC-003", title: "Empty password field disabled submit", status: "Pass" as const },
    ],
  },
  veteran: {
    requirement: "Run regression across 3 providers, 12 regions, 4 auth flows.",
    highlight: "3 providers, 12 regions, 4 auth flows",
    testCases: [
      { id: "TC-001", title: "Multi-provider test matrix generated", status: "Pass" as const },
      { id: "TC-002", title: "Parallel execution config exported", status: "Pass" as const },
      { id: "TC-003", title: "Cross-region coverage gaps flagged", status: "Pass" as const },
    ],
  },
};

const STATS = [
  { label: "tests_generated", value: "50,234" },
  { label: "providers", value: "6" },
  { label: "uptime", value: "99.9%" },
];

const PRICING_TIERS = [
  { name: "Starter", price: "₹0", period: "/mo", desc: "Solo testers, fast onboarding.", features: ["100 test generations/mo", "3 AI providers", "CSV & PDF export", "Email support"], cta: "Start Free Trial", highlighted: false, label: "solo testers, fast onboarding" },
  { name: "Team", price: "₹999", period: "/mo", desc: "Shared suites across fresher + senior testers.", features: ["5,000 test generations/mo", "All AI providers", "Multi-format export", "Team workspaces", "Priority email support"], cta: "Start Free Trial", highlighted: true, label: "shared suites across fresher + senior testers" },
  { name: "Enterprise", price: "Custom", period: "", desc: "Full compliance + audit trail.", features: ["Unlimited generations", "On-premise deployment option", "SSO/SAML", "Dedicated support engineer", "Custom integrations", "SLA guarantee"], cta: "Contact Sales", highlighted: false, label: "full compliance + audit trail" },
];

const FAQ_ITEMS = [
  { q: "How does NexTest handle my data?", a: "Your requirements and generated test cases are stored in your dedicated MongoDB instance. We never share or sell your data. API keys are encrypted at rest with AES-256-GCM." },
  { q: "Which AI provider sees my data?", a: "The provider you choose. When you bring your own API key (BYOK), requests go directly to that provider — NexTest never proxies through a shared pool. You control exactly which model processes your requirements." },
  { q: "Can I bring my own API key?", a: "Yes — every AI provider supports BYOK. Your key is encrypted and stored securely. You can rotate or revoke it at any time from the settings panel." },
  { q: "What export formats are supported?", a: "PDF, CSV, XLSX, and JUnit XML. Direct CI integrations include GitHub Actions, GitLab CI, and Jenkins via webhook." },
  { q: "What is your cancellation policy?", a: "Cancel anytime. Your data remains accessible for 30 days after cancellation. Annual plans are prorated and refunded for the unused portion." },
  { q: "Is there a free trial?", a: "Yes — all plans include a 14-day free trial with full feature access. No credit card required." },
];

/* ── Shared sub-components ── */

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: delay * 0.001, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatusPill({ status }: { status: "Pass" | "Fail" | "Pending" }) {
  const color = status === "Pass" ? "var(--lp-Pass)" : status === "Fail" ? "var(--lp-Fail)" : "var(--lp-Pending)";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

function ReportRow({ id, label, children, accent }: { id: string; label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 px-1" style={{ borderBottom: "1px solid var(--lp-border)" }}>
      <span className="font-mono text-[11px] w-16 shrink-0" style={{ color: "var(--text-muted-landing)" }}>{id}</span>
      <span className="text-sm flex-1" style={{ color: accent ? "var(--text-primary-landing)" : "var(--text-muted-landing)", fontWeight: accent ? 600 : 400 }}>{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── Hero Diff Animation ── */

function HeroDiff({ persona }: { persona: "fresher" | "veteran" }) {
  const example = PERSONA_EXAMPLES[persona];
  const [phase, setPhase] = useState<"typing" | "trace" | "done">("typing");
  const [typed, setTyped] = useState(0);
  const [visibleTests, setVisibleTests] = useState(0);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typed < example.requirement.length) {
      const t = setTimeout(() => setTyped((p) => p + 1), 20);
      return () => clearTimeout(t);
    }
    setTimeout(() => setPhase("trace"), 300);
  }, [phase, typed, example.requirement.length]);

  useEffect(() => {
    if (phase !== "trace") return;
    if (visibleTests < example.testCases.length) {
      const t = setTimeout(() => setVisibleTests((p) => p + 1), 400);
      return () => clearTimeout(t);
    }
    setTimeout(() => setPhase("done"), 200);
  }, [phase, visibleTests, example.testCases.length]);

  const hlStart = example.requirement.indexOf(example.highlight);
  const hlEnd = hlStart + example.highlight.length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg-inverse)" }}>
      {/* Terminal bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--lp-border)" }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--lp-Fail)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--lp-Pending)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--lp-Pass)" }} />
        <span className="ml-2 text-[11px] font-mono" style={{ color: "var(--text-muted-landing)" }}>nex test generate —diff</span>
      </div>
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Requirement line */}
        <div className="text-sm font-mono leading-relaxed" style={{ color: "var(--text-primary-landing)" }}>
          <span style={{ color: "var(--lp-Signal)" }}>$</span> read requirement
          <br />
          <span className="text-xs" style={{ color: "var(--text-muted-landing)" }}>Parsing spec...</span>
        </div>
        {/* Animated text */}
        <div className="relative min-h-[3rem]">
          <p className="text-sm leading-relaxed font-mono" style={{ color: "var(--text-muted-landing)" }}>
            {example.requirement.slice(0, typed)}
            {phase === "typing" && <span className="animate-pulse" style={{ color: "var(--lp-Signal)" }}>▌</span>}
          </p>
          {typed >= example.requirement.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{ background: `color-mix(in srgb, var(--lp-Signal) 15%, transparent)`, color: "var(--lp-Signal)" }}
            >
              {example.highlight}
            </motion.div>
          )}
        </div>
        {/* Generated test cases */}
        {phase !== "typing" && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--lp-Signal)" }}>
              <span>{">"} generating test cases</span>
              {phase === "trace" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            </div>
            <AnimatePresence>
              {example.testCases.slice(0, visibleTests).map((tc, i) => (
                <motion.div
                  key={tc.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted-landing)" }}>{tc.id}</span>
                  <span className="text-xs flex-1" style={{ color: "var(--text-primary-landing)" }}>{tc.title}</span>
                  <StatusPill status={tc.status} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {/* Stats — show when done */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="pt-3 flex gap-6 text-xs font-mono" style={{ borderTop: "1px solid var(--lp-border)" }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <span style={{ color: "var(--text-muted-landing)" }}>$ {s.label}</span>
                <span className="ml-2 font-semibold" style={{ color: "var(--text-primary-landing)" }}>{s.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Trust Marquee ── */

function TrustMarquee() {
  return (
    <div className="relative overflow-hidden w-full">
      <motion.div
        className="flex items-center gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        whileHover={{ pause: true }}
      >
        {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
          <span key={i} className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-muted-landing)" }}>
            {p.name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Persona split cards ── */

function PersonaSplit({ persona }: { persona: "fresher" | "veteran" }) {
  const cards = [
    {
      persona: "fresher",
      before: "I stare at a blank test plan and don't know what I'm missing.",
      after: "AI surfaces edge cases automatically — like having a senior reviewer beside me.",
      example: "Login form: AI catches password-reset flow, rate-limiting, XSS injection — all from one line in the spec.",
    },
    {
      persona: "veteran",
      before: "I write the same 200 test cases every sprint and manually translate them into Playwright.",
      after: "One-click script export + versioned generation history — no manual translation, no drift.",
      example: "Regression matrix: AI generates 84 test cases across 3 providers, 12 regions, 4 auth flows in 12 seconds.",
    },
  ];

  const active = cards.find((c) => c.persona === persona) || cards[0];

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {cards.map((c) => {
        const isActive = c.persona === persona;
        return (
          <div key={c.persona}
            className="rounded-xl p-5 transition-all duration-200"
            style={{
              background: isActive ? "var(--bg-elevated)" : "transparent",
              border: `1px solid ${isActive ? "var(--lp-Signal)" : "var(--lp-border)"}`,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "var(--lp-Signal)" }}>
              {c.persona === "fresher" ? "New here" : "QA veteran"}
            </span>
            <div className="mt-3 space-y-2">
              <p className="text-xs line-through" style={{ color: "var(--text-muted-landing)" }}>{c.before}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--lp-Pass)" }}>{c.after}</p>
              <p className="text-xs" style={{ color: "var(--text-muted-landing)", fontFamily: "var(--font-mono)" }}>{c.example}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── FAQ Accordion ── */

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} style={{ borderBottom: i < items.length - 1 ? "1px solid var(--lp-border)" : "none" }}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center gap-4 px-1 py-4 text-left cursor-pointer"
              style={{ background: "transparent", border: "none", color: "var(--text-primary-landing)", borderLeft: isOpen ? "2px solid var(--lp-Signal)" : "2px solid transparent", paddingLeft: isOpen ? "calc(0.25rem - 2px)" : "0.25rem" }}
              aria-expanded={isOpen}
            >
              <span className="font-mono text-xs w-8 shrink-0" style={{ color: "var(--text-muted-landing)" }}>{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-semibold flex-1">{item.q}</span>
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted-landing)" }} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm leading-relaxed" style={{ color: "var(--text-muted-landing)", paddingLeft: "2.75rem" }}>
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
  const [scrolled, setScrolled] = useState(false);
  const [persona, setPersona] = useState<"fresher" | "veteran">("fresher");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("support") === "true") {
      setTimeout(() => {
        document.getElementById("support-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  /* Enterprise inquiry modal */
  const navigate = useNavigate();
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ name: "", email: "", company: "", message: "" });
  const [enterpriseSent, setEnterpriseSent] = useState(false);
  const [enterpriseSending, setEnterpriseSending] = useState(false);
  const [enterpriseErrors, setEnterpriseErrors] = useState<Record<string, string>>({});

  function openEnterpriseModal() { setShowEnterpriseModal(true); }
  function closeEnterpriseModal() { setShowEnterpriseModal(false); setTimeout(() => { setEnterpriseSent(false); setEnterpriseForm({ name: "", email: "", company: "", message: "" }); setEnterpriseErrors({}); }, 200); }

  const validateEnterprise = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!enterpriseForm.name.trim()) errs.name = "Name is required.";
    if (!enterpriseForm.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enterpriseForm.email)) errs.email = "Enter a valid email address.";
    if (!enterpriseForm.company.trim()) errs.company = "Company is required.";
    if (!enterpriseForm.message.trim()) errs.message = "Message is required.";
    else if (enterpriseForm.message.trim().length < 20) errs.message = "Please include at least 20 characters so we can understand your needs.";
    return errs;
  }, [enterpriseForm]);

  async function handleEnterpriseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateEnterprise();
    setEnterpriseErrors(errs);
    if (Object.keys(errs).length) return;
    setEnterpriseSending(true);
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "62dd773d-d156-48a6-baa0-8264963687ee",
          name: enterpriseForm.name,
          email: enterpriseForm.email,
          subject: `Enterprise inquiry from ${enterpriseForm.company}`,
          message: `Company: ${enterpriseForm.company}\n\n${enterpriseForm.message}`,
        }),
      });
    } catch { /* ignore */ }
    setEnterpriseSending(false);
    setEnterpriseSent(true);
  }

  useEffect(() => {
    if (!enterpriseSent) return;
    const t = setTimeout(() => {
      closeEnterpriseModal();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 4000);
    return () => clearTimeout(t);
  }, [enterpriseSent]);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-150"
        style={{
          background: scrolled ? "var(--bg-base)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--lp-border)" : "1px solid transparent",
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
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
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
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthed ? (
              <button onClick={onGetStarted} type="button"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button onClick={onSignIn} type="button"
                  className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted-landing)"; e.currentTarget.style.background = "transparent"; }}
                >
                  Sign In
                </button>
                <button onClick={onGetStarted} type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} type="button"
              className="md:hidden flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer"
              style={{ width: 34, height: 34, color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t animate-fade-in" style={{ borderColor: "var(--lp-border)" }}>
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium px-3 py-2.5 rounded-lg no-underline transition-all duration-150"
                  style={{ color: "var(--text-muted-landing)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary-landing)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
                  style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
                >
                  Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button onClick={onSignIn} type="button"
                    className="w-full text-sm font-medium py-2.5 rounded-lg transition-all duration-150"
                    style={{ color: "var(--text-muted-landing)", background: "transparent", border: "1px solid var(--lp-border)" }}
                  >
                    Sign In
                  </button>
                  <button onClick={onGetStarted} type="button"
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-all duration-150"
                    style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
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
      <section className="relative max-w-7xl mx-auto px-6 pt-28 lg:px-10 lg:pt-36" style={{ paddingBottom: "6rem" }}>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              AI-powered test generation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Stop guessing what to test.<br />
              <span style={{ color: "var(--lp-Signal)" }}>Start shipping it.</span>
            </h1>
            <p className="mt-4 text-base lg:text-lg max-w-lg leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
              Whether you're writing your first test case or your thousandth, NexTest turns a requirement into a test suite before you finish your coffee.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {isAuthed ? (
                <button onClick={onGetStarted} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}>
                  Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={onGetStarted} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={onSignIn} type="button" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer" style={{ color: "var(--text-primary-landing)", background: "transparent", border: "1px solid var(--lp-border)" }}>
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {/* Persona toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg w-fit" style={{ background: "var(--bg-elevated)", border: "1px solid var(--lp-border)" }}>
              {(["fresher", "veteran"] as const).map((p) => (
                <button key={p} onClick={() => setPersona(p)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer"
                  style={{
                    background: persona === p ? "var(--lp-Signal)" : "transparent",
                    color: persona === p ? "#fff" : "var(--text-muted-landing)",
                    border: "none",
                  }}
                  aria-pressed={persona === p}
                >
                  {p === "fresher" ? "New here" : "QA veteran"}
                </button>
              ))}
            </div>
            <HeroDiff persona={persona} />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <p className="text-xs font-semibold text-center mb-5" style={{ color: "var(--text-muted-landing)" }}>
          Bring your own provider — your data never trains theirs.
        </p>
        <div className="flex items-center justify-center gap-10 opacity-50">
          <TrustMarquee />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Built for every stage of testing
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-base" style={{ color: "var(--text-muted-landing)" }}>
              From spec to test suite in three steps.
            </p>
          </div>
        </ScrollReveal>

        {/* Connected timeline */}
        <div className="relative grid md:grid-cols-3 gap-5 lg:gap-8 items-start">
          {/* Spine line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px" style={{ background: "var(--lp-border)" }} />
          {PIPELINE_STAGES.map((stage, i) => (
            <ScrollReveal key={stage.step} delay={i * 100}>
              <div className="rounded-xl p-6 lg:p-8 h-full" style={{ background: "var(--bg-elevated)", border: "1px solid var(--lp-border)" }}>
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
                    <stage.icon className="w-5 h-5" style={{ color: "var(--lp-Signal)" }} />
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--lp-Signal)" }}>{stage.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>{stage.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>{stage.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Persona split panel */}
        <div className="mt-12 md:mt-16">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
                Designed for how you test
              </h3>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <PersonaSplit persona={persona} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Features deep-dive ── */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Before NexTest vs. After
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-start">
          <ScrollReveal>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--lp-border)" }}>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--bg-elevated)", color: "var(--text-muted-landing)", borderBottom: "1px solid var(--lp-border)" }}>
                <span style={{ color: "var(--lp-Signal)" }}>$</span> Impact report
              </div>
              <div className="px-4">
                {FEATURE_ROWS.map((row) => (
                  <ReportRow key={row.id} id={row.id} label={row.label}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs hidden sm:inline" style={{ color: "var(--text-muted-landing)" }}>{row.outcome}</span>
                      <StatusPill status={row.status} />
                    </div>
                  </ReportRow>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Static Diff echo */}
          <ScrollReveal delay={100}>
            <div className="rounded-xl p-5" style={{ background: "var(--lp-bg-inverse)", border: "1px solid var(--lp-border)" }}>
              <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted-landing)" }}>
                <span style={{ color: "var(--lp-Signal)" }}>$</span> spec in — structured test out
              </div>
              <p className="text-sm font-mono leading-relaxed mb-3" style={{ color: "var(--text-primary-landing)" }}>
                {FEATURE_DIFF_EXAMPLE.requirement}
              </p>
              <div className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-4" style={{ background: `color-mix(in srgb, var(--lp-Signal) 15%, transparent)`, color: "var(--lp-Signal)" }}>
                {FEATURE_DIFF_EXAMPLE.highlight}
              </div>
              <div className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted-landing)" }}>{FEATURE_DIFF_EXAMPLE.testCase.id}</span>
                <span className="text-xs flex-1" style={{ color: "var(--text-primary-landing)" }}>{FEATURE_DIFF_EXAMPLE.testCase.title}</span>
                <StatusPill status={FEATURE_DIFF_EXAMPLE.testCase.status} />
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Secondary mini features */}
        <div className="grid sm:grid-cols-3 gap-5 mt-8">
          {[
            { icon: Shield, title: "Enterprise-grade security", desc: "AES-256-GCM encrypted API keys. SOC 2 compliant infrastructure. Your data never trains third-party models." },
            { icon: Download, title: "Multi-format export", desc: "PDF, CSV, XLSX, JUnit XML, and direct CI integration." },
            { icon: FileText, title: "Generation history", desc: "Every test case is versioned. Roll back, diff, or replay any generation." },
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--lp-border)" }}>
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
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Plans that scale with your team
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-5 lg:gap-8 max-w-5xl mx-auto items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <ScrollReveal key={tier.name} delay={i * 100}>
              <div className="rounded-xl p-6 lg:p-8 flex flex-col h-full"
                style={{
                  background: tier.highlighted ? "var(--lp-bg-inverse)" : "var(--bg-elevated)",
                  border: tier.highlighted ? `1px solid var(--lp-Signal)` : `1px solid var(--lp-border)`,
                }}
              >
                {tier.highlighted && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full self-start mb-3" style={{ background: "var(--lp-Signal)", color: "#fff", fontSize: 10 }}>
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-primary-landing)" }}>{tier.price}</span>
                  {tier.period && <span className="text-sm" style={{ color: "var(--text-muted-landing)" }}>{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted-landing)" }}>{tier.desc}</p>
                <p className="text-[11px] mt-1 font-mono" style={{ color: "var(--text-muted-landing)" }}>— {tier.label}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="w-4 h-4 shrink-0 mt-0.5 rounded-full flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--lp-Pass) 15%, transparent)` }}>
                        <svg className="w-2.5 h-2.5" style={{ color: "var(--lp-Pass)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span style={{ color: "var(--text-muted-landing)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={tier.name === "Enterprise" ? openEnterpriseModal : onGetStarted} type="button" className="mt-8 w-full py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  style={{
                    color: tier.highlighted ? "#fff" : "var(--text-primary-landing)",
                    background: tier.highlighted ? "var(--lp-Signal)" : "transparent",
                    border: tier.highlighted ? "none" : `1px solid var(--lp-border)`,
                  }}
                  onMouseEnter={(e) => { if (!tier.highlighted) { e.currentTarget.style.borderColor = "var(--lp-Signal)"; e.currentTarget.style.color = "var(--lp-Signal)"; }}}
                  onMouseLeave={(e) => { if (!tier.highlighted) { e.currentTarget.style.borderColor = "var(--lp-border)"; e.currentTarget.style.color = "var(--text-primary-landing)"; }}}
                >
                  {isAuthed && tier.name !== "Enterprise" ? "Dashboard" : tier.cta}
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>
              Questions? Answered.
            </h2>
          </div>
        </ScrollReveal>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* ── Contact form ── */}
      <section id="support-form" className="max-w-5xl mx-auto px-6 lg:px-10" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)`, color: "var(--lp-Signal)", border: "1px solid color-mix(in srgb, var(--lp-Signal) 20%, transparent)" }}>
              Contact
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
            <div className="rounded-xl p-12 text-center max-w-lg mx-auto" style={{ background: "var(--bg-elevated)", border: "1px solid var(--lp-border)" }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-xl mx-auto mb-5" style={{ background: `color-mix(in srgb, var(--lp-Pass) 12%, transparent)` }}>
                <Check className="w-8 h-8" style={{ color: "var(--lp-Pass)" }} />
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)` }}>
                      <MessageSquare className="w-4 h-4" style={{ color: "var(--lp-Signal)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary-landing)" }}>Email us</p>
                      <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>hello@forgeqa.in</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: `color-mix(in srgb, var(--lp-Signal) 10%, transparent)` }}>
                      <svg className="w-4 h-4" style={{ color: "var(--lp-Signal)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary-landing)" }}>Response time</p>
                      <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>Typically within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSupportSubmit} className="rounded-xl p-6 sm:p-8 space-y-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--lp-border)" }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="support-name" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Name</label>
                    <input id="support-name" type="text" required value={supportForm.name} onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe"
                      className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-base)", border: supportErrors.name ? "2px solid var(--Pending)" : "2px solid var(--lp-border)", transition: "border-color 0.15s ease" }}
                      onFocus={(e) => { if (!supportErrors.name) e.target.style.borderColor = "var(--lp-Signal)"; }}
                      onBlur={(e) => { if (!supportErrors.name) e.target.style.borderColor = "var(--lp-border)"; }}
                    />
                    {supportErrors.name && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{supportErrors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="support-email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Email</label>
                    <input id="support-email" type="email" required value={supportForm.email} onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com"
                      className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-base)", border: supportErrors.email ? "2px solid var(--Pending)" : "2px solid var(--lp-border)", transition: "border-color 0.15s ease" }}
                      onFocus={(e) => { if (!supportErrors.email) e.target.style.borderColor = "var(--lp-Signal)"; }}
                      onBlur={(e) => { if (!supportErrors.email) e.target.style.borderColor = "var(--lp-border)"; }}
                    />
                    {supportErrors.email && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{supportErrors.email}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="support-subject" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Subject</label>
                  <select id="support-subject" value={supportForm.subject} onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                    style={{ color: "var(--text-primary-landing)", background: "var(--bg-base)", border: "2px solid var(--lp-border)", transition: "border-color 0.15s ease" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--lp-Signal)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--lp-border)"; }}
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
                      style={{ color: "var(--text-primary-landing)", background: "var(--bg-base)", border: "2px solid var(--lp-border)", transition: "border-color 0.15s ease" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--lp-Signal)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--lp-border)"; }}
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="support-message" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Message</label>
                  <textarea id="support-message" required rows={4} value={supportForm.message} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} placeholder="Tell us more about your question or issue..."
                    className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg resize-y"
                    style={{ color: "var(--text-primary-landing)", background: "var(--bg-base)", border: supportErrors.message ? "2px solid var(--Pending)" : "2px solid var(--lp-border)", transition: "border-color 0.15s ease" }}
                    onFocus={(e) => { if (!supportErrors.message) e.target.style.borderColor = "var(--lp-Signal)"; }}
                    onBlur={(e) => { if (!supportErrors.message) e.target.style.borderColor = "var(--lp-border)"; }}
                  />
                  <div className="flex justify-between mt-1">
                    {supportErrors.message ? <p className="text-xs" style={{ color: "var(--lp-Fail)" }}>{supportErrors.message}</p> : <span />}
                    <span className="text-xs" style={{ color: "var(--text-muted-landing)" }}>{supportForm.message.length}/2000</span>
                  </div>
                </div>
                <button type="submit" disabled={supportSending}
                  className="w-full py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
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
      <footer style={{ background: "var(--lp-bg-inverse)", borderTop: "1px solid var(--lp-border)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-1">
              <Logo variant="wordmark" />
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted-landing)" }}>
                AI-powered QA automation for teams that ship with confidence.
              </p>
            </div>
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
          <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--lp-border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted-landing)" }}>&copy; {new Date().getFullYear()} ForgeQA. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Enterprise inquiry modal ── */}
      <AnimatePresence>
        {showEnterpriseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={closeEnterpriseModal}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl overflow-hidden"
              style={{ background: "var(--bg-base)", border: "1px solid var(--lp-border)" }}
            >
              {enterpriseSent ? (
                <div className="p-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5"
                    style={{ background: `color-mix(in srgb, var(--lp-Pass) 12%, transparent)` }}
                  >
                    <Check className="w-8 h-8" style={{ color: "var(--lp-Pass)" }} />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}
                  >
                    Thank you for reaching out!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-2 text-sm max-w-sm mx-auto"
                    style={{ color: "var(--text-muted-landing)" }}
                  >
                    Our enterprise team will review your inquiry and get back to you within 24 hours.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 text-xs"
                    style={{ color: "var(--text-muted-landing)" }}
                  >
                    Redirecting you back...
                  </motion.p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--lp-border)" }}>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary-landing)", fontFamily: "var(--font-display)" }}>Enterprise inquiry</h3>
                      <p className="text-sm mt-0.5" style={{ color: "var(--text-muted-landing)" }}>Tell us about your team's needs.</p>
                    </div>
                    <button onClick={closeEnterpriseModal} type="button"
                      className="flex items-center justify-center rounded-lg cursor-pointer"
                      style={{ width: 32, height: 32, color: "var(--text-muted-landing)", background: "transparent", border: "none" }}
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleEnterpriseSubmit} className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="enterprise-name" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Name</label>
                        <input id="enterprise-name" type="text" required value={enterpriseForm.name} onChange={(e) => setEnterpriseForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe"
                          className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                          style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: enterpriseErrors.name ? "2px solid var(--lp-Fail)" : "2px solid var(--lp-border)" }}
                          onFocus={(e) => { if (!enterpriseErrors.name) e.target.style.borderColor = "var(--lp-Signal)"; }}
                          onBlur={(e) => { if (!enterpriseErrors.name) e.target.style.borderColor = "var(--lp-border)"; }}
                        />
                        {enterpriseErrors.name && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{enterpriseErrors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="enterprise-email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Email</label>
                        <input id="enterprise-email" type="email" required value={enterpriseForm.email} onChange={(e) => setEnterpriseForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com"
                          className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                          style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: enterpriseErrors.email ? "2px solid var(--lp-Fail)" : "2px solid var(--lp-border)" }}
                          onFocus={(e) => { if (!enterpriseErrors.email) e.target.style.borderColor = "var(--lp-Signal)"; }}
                          onBlur={(e) => { if (!enterpriseErrors.email) e.target.style.borderColor = "var(--lp-border)"; }}
                        />
                        {enterpriseErrors.email && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{enterpriseErrors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="enterprise-company" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Company</label>
                      <input id="enterprise-company" type="text" required value={enterpriseForm.company} onChange={(e) => setEnterpriseForm((p) => ({ ...p, company: e.target.value }))} placeholder="Acme Inc."
                        className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg"
                        style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: enterpriseErrors.company ? "2px solid var(--lp-Fail)" : "2px solid var(--lp-border)" }}
                        onFocus={(e) => { if (!enterpriseErrors.company) e.target.style.borderColor = "var(--lp-Signal)"; }}
                        onBlur={(e) => { if (!enterpriseErrors.company) e.target.style.borderColor = "var(--lp-border)"; }}
                      />
                      {enterpriseErrors.company && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{enterpriseErrors.company}</p>}
                    </div>
                    <div>
                      <label htmlFor="enterprise-message" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted-landing)" }}>Tell us about your testing needs</label>
                      <textarea id="enterprise-message" required rows={4} value={enterpriseForm.message} onChange={(e) => setEnterpriseForm((p) => ({ ...p, message: e.target.value }))} placeholder="How many testers? Which AI providers? On-prem or cloud? Any compliance requirements?"
                        className="w-full text-sm outline-none transition-all px-4 py-2.5 rounded-lg resize-y"
                        style={{ color: "var(--text-primary-landing)", background: "var(--bg-elevated)", border: enterpriseErrors.message ? "2px solid var(--lp-Fail)" : "2px solid var(--lp-border)" }}
                        onFocus={(e) => { if (!enterpriseErrors.message) e.target.style.borderColor = "var(--lp-Signal)"; }}
                        onBlur={(e) => { if (!enterpriseErrors.message) e.target.style.borderColor = "var(--lp-border)"; }}
                      />
                      {enterpriseErrors.message && <p className="mt-1 text-xs" style={{ color: "var(--lp-Fail)" }}>{enterpriseErrors.message}</p>}
                    </div>
                    <button type="submit" disabled={enterpriseSending}
                      className="w-full py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      style={{ color: "#fff", background: "var(--lp-Signal)", border: "none" }}
                    >
                      {enterpriseSending ? (
                        <span className="h-4 w-4 rounded-full border-2 border-[var(--bg-base)] border-t-transparent animate-spin" />
                      ) : (
                        <>Submit Inquiry</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
