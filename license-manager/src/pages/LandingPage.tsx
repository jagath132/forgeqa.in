import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun, Moon, Menu, X, ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  KeyRound, Users, Blocks, ShieldCheck, CreditCard, Mail, Star,
  Check
} from "lucide-react";
import "./landing.css";

const COMPANIES = [
  "TechFlow", "DataBridge", "CloudPeak", "ScaleLab", "CodeForge",
  "NexGen", "StackPulse", "DevForge", "OpsCore", "Launchpad",
];

const STEPS = [
  {
    icon: KeyRound,
    title: "Generate Keys",
    desc: "Create product keys in batches with custom prefixes, expiry rules, and hardware-locking policies.",
  },
  {
    icon: Users,
    title: "Manage Customers",
    desc: "Track every user's plan, payment history, and activation status from a single registry.",
  },
  {
    icon: ShieldCheck,
    title: "Verify & Monitor",
    desc: "Approve registrations, monitor usage, and get full audit trails for every action.",
  },
];

const FEATURES = [
  {
    icon: KeyRound,
    title: "Key Generation & Distribution",
    desc: "Generate, validate, and distribute product keys at scale. Batch generation, custom prefixes, expiry policies, and hardware locking.",
    wide: true,
    variant: "amber",
  },
  {
    icon: Users,
    title: "Customer Management",
    desc: "Maintain a complete registry of licensed users. Track plan assignments, payment history, and activation status.",
    wide: false,
    variant: "emerald",
  },
  {
    icon: Blocks,
    title: "Plan Configuration",
    desc: "Define subscription tiers with granular feature limits. Manage pricing and billing periods without deploying code.",
    wide: false,
    variant: "violet",
  },
  {
    icon: ShieldCheck,
    title: "Registration Verification",
    desc: "Review, approve, or reject sign-ups with full context. Complete audit trail for every decision.",
    wide: true,
    variant: "amber",
  },
  {
    icon: CreditCard,
    title: "Transaction Monitoring",
    desc: "Track every payment and refund in real time. Stripe integration with automatic reconciliation.",
    wide: true,
    variant: "blue",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    desc: "Automated transactional emails for key delivery, payment receipts, and expiry warnings with send history.",
    wide: false,
    variant: "rose",
  },
];

const STATS = [
  { value: 50, suffix: "K+", label: "Keys Managed" },
  { value: 2400, label: "Active Customers" },
  { value: 12, label: "Plans Supported" },
  { value: 99.9, suffix: "%", label: "Uptime SLA" },
];

const TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    role: "CTO, TechFlow",
    avatar: "RS",
    quote: "ForgeKey transformed how we manage software licenses. The verification workflow alone saved us dozens of hours every month.",
  },
  {
    name: "Priya Patel",
    role: "Head of Product, DataBridge",
    avatar: "PP",
    quote: "We evaluated over a dozen licensing platforms. ForgeKey was the only one that checked every box — and their API is exceptional.",
  },
  {
    name: "Arjun Mehta",
    role: "Founder, CloudPeak",
    avatar: "AM",
    quote: "Setting up licensing infrastructure used to take weeks. With ForgeKey, we were live and issuing keys in an afternoon.",
  },
  {
    name: "Neha Gupta",
    role: "Engineering Lead, ScaleLab",
    avatar: "NG",
    quote: "Batch key generation and customer management are top-notch. It's rare to find a tool this polished in this space.",
  },
  {
    name: "Vikram Singh",
    role: "CEO, CodeForge",
    avatar: "VS",
    quote: "ForgeKey gives us the confidence to scale our licensing operation without worrying about leaks or mismanagement.",
  },
];

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${visible ? "fk-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function useCountUp(target: number, visible: boolean, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration]);
  return count;
}

/* ── Slides for carousel ── */
function SlideDashboard() {
  return (
    <div>
      <div className="fk-showcase-window-bar">
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span style={{ fontSize: 11, color: "var(--fk-text-muted)", marginLeft: 8 }}>dashboard</span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          {["Total Keys", "Active Users", "Revenue"].map((label, i) => (
            <div key={label} className="fk-showcase-mock-card" style={{ padding: 14 }}>
              <div className="fk-showcase-mock-label">{label}</div>
              <div className="fk-showcase-mock-value">{["12,458", "2,391", "$48,290"][i]}</div>
            </div>
          ))}
        </div>
        <div className="fk-showcase-mock-card">
          <div className="fk-showcase-mock-label">Recent Activity</div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="fk-showcase-mock-row" style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--fk-border)" : "none" }}>
              <div className="fk-showcase-mock-bar short" />
              <div className="fk-showcase-mock-bar" style={{ flex: 0.6 }} />
              <div className="fk-showcase-mock-bar" style={{ flex: 0.3, background: "var(--fk-accent-subtle)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideKeys() {
  return (
    <div>
      <div className="fk-showcase-window-bar">
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span style={{ fontSize: 11, color: "var(--fk-text-muted)", marginLeft: 8 }}>product-keys</span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="fk-showcase-mock-label" style={{ marginBottom: 10 }}>Product Keys</div>
        <div className="fk-showcase-mock-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 0, padding: "10px 14px", background: "var(--fk-surface-alt)", borderBottom: "1px solid var(--fk-border)", fontSize: 11, fontWeight: 600, color: "var(--fk-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>Key</span><span>Customer</span><span>Plan</span><span>Status</span>
          </div>
          {["FRGK-A1B2-C3D4", "FRGK-E5F6-G7H8", "FRGK-I9J0-K1L2"].map((key, i) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 0, padding: "10px 14px", borderBottom: i < 2 ? "1px solid var(--fk-border)" : "none", fontSize: 13, color: "var(--fk-text-secondary)", fontFamily: "var(--fk-font-mono)" }}>
              <span style={{ color: "var(--fk-text)" }}>{key}</span>
              <span style={{ fontFamily: "var(--fk-font-body)" }}>{["alice@co", "bob@inc", "carol@ltd"][i]}</span>
              <span style={{ fontFamily: "var(--fk-font-body)" }}>{["Pro", "Enterprise", "Pro"][i]}</span>
              <span style={{ fontFamily: "var(--fk-font-body)", color: "var(--fk-success)" }}>Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideCustomers() {
  return (
    <div>
      <div className="fk-showcase-window-bar">
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span className="fk-showcase-dot" />
        <span style={{ fontSize: 11, color: "var(--fk-text-muted)", marginLeft: 8 }}>customers</span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="fk-showcase-mock-label" style={{ marginBottom: 10 }}>Customers</div>
        <div className="fk-showcase-mock-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="fk-showcase-mock-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--fk-accent-subtle)", color: "var(--fk-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                {["AC", "BI", "CL", "DM", "EF", "GH"][i - 1]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fk-text)" }}>
                  {["Acme Corp", "Blue Inc", "Cloud Ltd", "DataMix", "EdgeFlow", "GreyHaven"][i - 1]}
                </div>
                <div style={{ fontSize: 11, color: "var(--fk-text-muted)" }}>Pro Plan</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SHOWCASE_SLIDES = [
  { component: SlideDashboard, label: "Dashboard" },
  { component: SlideKeys, label: "Keys" },
  { component: SlideCustomers, label: "Customers" },
];

/* ── Hero key visual ── */
function HeroVisual() {
  return (
    <div className="fk-hero-visual">
      <div className="fk-key-art">
        <div className="fk-key-ring" />
        <div className="fk-key-ring-2" />
        <div className="fk-key-glow" />
        <div className="fk-key-icon">
          <KeyRound size={80} strokeWidth={1.2} />
        </div>
        <div className="fk-particle" />
        <div className="fk-particle" />
        <div className="fk-particle" />
        <div className="fk-particle" />
        <div className="fk-particle" />
        <div className="fk-particle" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showcaseIdx, setShowcaseIdx] = useState(0);
  const [testimonialsIdx, setTestimonialsIdx] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [testimonialsTrackPos, setTestimonialsTrackPos] = useState(0);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("fk-theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const scrollTo = useCallback((id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  const nextShowcase = useCallback(() => setShowcaseIdx((i) => (i + 1) % SHOWCASE_SLIDES.length), []);
  const prevShowcase = useCallback(() => setShowcaseIdx((i) => (i - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length), []);

  const maxTestimonialIdx = TESTIMONIALS.length - 3;
  const nextTestimonials = useCallback(() => {
    setTestimonialsIdx((i) => Math.min(i + 1, maxTestimonialIdx));
  }, [maxTestimonialIdx]);
  const prevTestimonials = useCallback(() => {
    setTestimonialsIdx((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setTestimonialsTrackPos(-(testimonialsIdx * (100 / 3)));
  }, [testimonialsIdx]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowcaseIdx((i) => (i + 1) % SHOWCASE_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const SlideComp = SHOWCASE_SLIDES[showcaseIdx].component;

  return (
    <div className={`lk-root${theme === "light" ? " light" : " dark"}`}>
      {/* ─── Navbar ─── */}
      <nav className="fk-nav">
        <div className="fk-nav-inner">
          <div className="fk-nav-left">
            <div className="fk-nav-logo">
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="fk-nav-brand">ForgeKey</span>
          </div>
          <div className="fk-nav-links">
            <button className="fk-nav-link" onClick={scrollTo("features")}>Features</button>
            <button className="fk-nav-link" onClick={scrollTo("showcase")}>Showcase</button>
            <button className="fk-nav-link" onClick={scrollTo("testimonials")}>Testimonials</button>
          </div>
          <div className="fk-nav-right">
            <button className="fk-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button className="fk-btn fk-btn-primary fk-nav-btn" onClick={onSignIn}>
              Sign In <ArrowRight size={14} />
            </button>
            <button className="fk-nav-btn-mobile" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="fk-mobile-menu fk-open">
            <button onClick={scrollTo("features")}>Features</button>
            <button onClick={scrollTo("showcase")}>Showcase</button>
            <button onClick={scrollTo("testimonials")}>Testimonials</button>
            <div className="fk-mobile-divider" />
            <button className="fk-btn fk-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={onSignIn}>
              Sign In <ArrowRight size={14} />
            </button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="fk-hero">
        <div className="fk-hero-bg">
          <div className="fk-hero-grid" />
          <div className="fk-hero-glow" />
        </div>
        <div className="fk-hero-inner">
          <div className="fk-hero-left">
            <div className="fk-hero-badge">
              <KeyRound size={12} strokeWidth={2.5} />
              License Infrastructure
            </div>
            <h1 className="fk-hero-title">
              Forge your<br /><em>license infrastructure.</em>
            </h1>
            <p className="fk-hero-sub">
              Generate keys, manage customers, configure plans, track payments, and verify registrations — from one unified dashboard.
            </p>
            <div className="fk-hero-actions">
              <button className="fk-btn fk-btn-primary fk-btn-lg" onClick={onSignIn}>
                Get Started <ArrowRight size={16} />
              </button>
              <button className="fk-btn fk-btn-secondary fk-btn-lg" onClick={onSignIn}>
                View Dashboard
              </button>
            </div>
          </div>
          <HeroVisual />
        </div>
        <div className="fk-scroll">
          <ChevronDown size={16} strokeWidth={1.5} />
          <div className="fk-scroll-line" />
        </div>
      </section>

      {/* ─── Trust Marquee ─── */}
      <div className="fk-marquee">
        <div className="fk-marquee-track">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <div key={`${name}-${i}`} className="fk-marquee-item">
              <Check size={14} strokeWidth={2.5} />
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <section className="fk-section" id="features">
        <ScrollReveal>
          <div className="fk-section-header">
            <h2 className="fk-section-title">How it works</h2>
            <p className="fk-section-sub">Three steps to get your license infrastructure up and running.</p>
          </div>
        </ScrollReveal>
        <div className="fk-steps-grid">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="fk-step" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="fk-step-num">{i + 1}</div>
                <div className="fk-step-icon"><Icon size={32} strokeWidth={1.5} /></div>
                <h3 className="fk-step-title">{step.title}</h3>
                <p className="fk-step-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="fk-section" style={{ paddingTop: 0 }}>
        <ScrollReveal>
          <div className="fk-section-header">
            <h2 className="fk-section-title">Everything you need</h2>
            <p className="fk-section-sub">A complete toolkit for software licensing operations — no gaps, no workarounds.</p>
          </div>
        </ScrollReveal>
        <div className="fk-features-grid">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <FeatureCard key={feat.title} feat={feat} Icon={Icon} index={i} />
            );
          })}
        </div>
      </section>

      {/* ─── Showcase Carousel ─── */}
      <div className="fk-showcase" id="showcase">
        <div className="fk-showcase-inner">
          <ScrollReveal>
            <div className="fk-section-header">
              <h2 className="fk-section-title">See it in action</h2>
              <p className="fk-section-sub">A peek inside the ForgeKey admin dashboard.</p>
            </div>
          </ScrollReveal>
          <div className="fk-showcase-frame">
            <div className="fk-showcase-window">
              <SlideComp />
            </div>
          </div>
          <div className="fk-showcase-controls">
            <button className="fk-showcase-btn" onClick={prevShowcase} aria-label="Previous">
              <ChevronLeft size={16} />
            </button>
            <div className="fk-showcase-dots">
              {SHOWCASE_SLIDES.map((_, i) => (
                <button key={i} className={`fk-showcase-dot-nav${i === showcaseIdx ? " active" : ""}`}
                  onClick={() => setShowcaseIdx(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            <button className="fk-showcase-btn" onClick={nextShowcase} aria-label="Next">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <section className="fk-stats" ref={statsRef}>
        <div className="fk-stats-inner">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} visible={statsVisible} delay={i * 120} />
          ))}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <div className="fk-testimonials" id="testimonials">
        <div className="fk-testimonials-inner">
          <ScrollReveal>
            <div className="fk-section-header">
              <h2 className="fk-section-title">Trusted by engineering teams</h2>
              <p className="fk-section-sub">Real feedback from teams that rely on ForgeKey daily.</p>
            </div>
          </ScrollReveal>
          <div style={{ overflow: "hidden" }}>
            <div className="fk-testimonials-track"
              style={{ transform: `translateX(${testimonialsTrackPos}%)` }}>
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="fk-testimonial-card">
                  <div className="fk-testimonial-stars">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} strokeWidth={1.5} fill="currentColor" />)}
                  </div>
                  <p className="fk-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="fk-testimonial-author">
                    <div className="fk-testimonial-avatar">{t.avatar}</div>
                    <div>
                      <div className="fk-testimonial-name">{t.name}</div>
                      <div className="fk-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fk-testimonial-controls">
            <button className="fk-showcase-btn" onClick={prevTestimonials} disabled={testimonialsIdx === 0}
              aria-label="Previous" style={{ opacity: testimonialsIdx === 0 ? 0.3 : 1 }}>
              <ChevronLeft size={16} />
            </button>
            <div className="fk-showcase-dots">
              {Array.from({ length: maxTestimonialIdx + 1 }).map((_, i) => (
                <button key={i} className={`fk-showcase-dot-nav${i === testimonialsIdx ? " active" : ""}`}
                  onClick={() => setTestimonialsIdx(i)} aria-label={`Testimonial ${i + 1}`} />
              ))}
            </div>
            <button className="fk-showcase-btn" onClick={nextTestimonials} disabled={testimonialsIdx >= maxTestimonialIdx}
              aria-label="Next" style={{ opacity: testimonialsIdx >= maxTestimonialIdx ? 0.3 : 1 }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <section className="fk-cta">
        <div className="fk-cta-bg">
          <div className="fk-cta-glow" />
          <div className="fk-hero-grid" style={{ opacity: 0.15 }} />
        </div>
        <div className="fk-cta-content">
          <ScrollReveal>
            <h2 className="fk-cta-title">Ready to forge your future?</h2>
            <p className="fk-cta-sub">Start managing your product keys and customers in minutes.</p>
            <div className="fk-cta-btn">
              <button className="fk-btn fk-btn-primary fk-btn-lg" onClick={onSignIn}>
                Get Started Free <ArrowRight size={16} />
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="fk-footer">
        <div className="fk-footer-inner">
          <div className="fk-footer-top">
            <div className="fk-footer-brand">
              <div className="fk-footer-logo">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="fk-footer-name">ForgeKey</span>
            </div>
            <div className="fk-footer-links">
              <a href="#" className="fk-footer-link">Documentation</a>
              <a href="#" className="fk-footer-link">API</a>
              <a href="#" className="fk-footer-link">Status</a>
              <a href="#" className="fk-footer-link">Privacy</a>
            </div>
          </div>
          <div className="fk-footer-bottom">
            <span>&copy; {new Date().getFullYear()} ForgeKey. All rights reserved.</span>
            <div className="fk-footer-social">
              <a href="#" aria-label="GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ feat, Icon, index }: { feat: typeof FEATURES[0]; Icon: React.ElementType; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const variantClass = feat.variant !== "amber" ? feat.variant : "";

  return (
    <div ref={ref}
      className={`fk-feature-card${feat.wide ? " wide" : ""}${variantClass ? ` ${variantClass}` : ""}${visible ? " fk-visible" : ""}`}
      style={{ transitionDelay: visible ? `${index * 60}ms` : "0ms" }}>
      <div className="fk-feature-icon"><Icon size={18} strokeWidth={1.8} /></div>
      <h3 className="fk-feature-title">{feat.title}</h3>
      <p className="fk-feature-desc">{feat.desc}</p>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ stat, visible, delay }: { stat: typeof STATS[0]; visible: boolean; delay: number }) {
  const count = useCountUp(stat.value, visible);

  return (
    <div className={`fk-stat${visible ? " fk-visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="fk-stat-value">
        {count.toLocaleString()}{stat.suffix || ""}
      </div>
      <div className="fk-stat-label">{stat.label}</div>
    </div>
  );
}
