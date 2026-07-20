import { useState, useEffect, useRef, useCallback } from "react";
import "./landing.css";

const STATS_DATA = [
  { value: 50, suffix: "K+", label: "Keys Managed" },
  { value: 2400, label: "Active Customers" },
  { value: 12, label: "Plans Supported" },
  { value: 99.9, suffix: "%", label: "Uptime SLA" },
];

const FEATURES = [
  {
    num: "01",
    icon: "key",
    color: "indigo",
    title: "Key Generation & Distribution",
    desc: "Generate, validate, and distribute product keys at scale. Batch generation, custom prefixes, expiry policies, and hardware locking — all from a single interface.",
  },
  {
    num: "02",
    icon: "users",
    color: "green",
    title: "Customer & Subscription Management",
    desc: "Maintain a complete registry of licensed users. Track plan assignments, payment history, and activation status. Handle upgrades, downgrades, and cancellations.",
  },
  {
    num: "03",
    icon: "shield",
    color: "amber",
    title: "Registration Verification",
    desc: "Automated verification workflows for new user registrations. Review, approve, or reject sign-ups with context. Full audit trail for every decision.",
  },
  {
    num: "04",
    icon: "sliders",
    color: "violet",
    title: "Plan & Pricing Configuration",
    desc: "Define subscription tiers with granular feature limits. Manage pricing, billing periods, and feature flags without deploying code.",
  },
  {
    num: "05",
    icon: "chart",
    color: "teal",
    title: "Transaction Monitoring",
    desc: "Track every payment and refund in real time. Stripe integration with automatic reconciliation. Export reports for accounting.",
  },
  {
    num: "06",
    icon: "envelope",
    color: "rose",
    title: "Email Notifications",
    desc: "Automated transactional emails for key delivery, registration confirmations, payment receipts, and expiry warnings. Full send history with status tracking.",
  },
];

const FOOTER_LINKS = [
  { label: "Documentation" },
  { label: "API Reference" },
  { label: "Status" },
  { label: "Privacy Policy" },
];

/* ── Icon components ── */

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <line x1="10.85" y1="12.15" x2="19" y2="4" />
      <line x1="18" y1="5" x2="20" y2="7" />
      <line x1="15" y1="8" x2="17" y2="10" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconEnvelope() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
      <path d="M16 17l2 2 4-4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

const ICONS: Record<string, React.FC> = {
  key: IconKey,
  users: IconUsers,
  shield: IconShield,
  sliders: IconSliders,
  chart: IconChart,
  envelope: IconEnvelope,
};

/* ── Scroll reveal wrapper ── */

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`lk-reveal${visible ? " lk-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Feature card ── */

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const IconComp = ICONS[feature.icon];

  return (
    <div
      ref={ref}
      className={`lk-feature-card${visible ? " lk-visible" : ""}`}
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
    >
      <span className="lk-feature-num">{feature.num}</span>
      <div className={`lk-feature-icon ${feature.color}`}>
        {IconComp && <IconComp />}
      </div>
      <h3 className="lk-feature-title">{feature.title}</h3>
      <p className="lk-feature-desc">{feature.desc}</p>
    </div>
  );
}

/* ── Count-up stat ── */

function CountUpStat({ stat, visible }: { stat: typeof STATS_DATA[0]; visible: boolean }) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!visible || startedRef.current) return;
    startedRef.current = true;
    const target = stat.value;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, stat.value]);

  return (
    <div className="lk-stat">
      <div className="lk-stat-value">
        {count.toLocaleString()}{stat.suffix || ""}
      </div>
      <div className="lk-stat-label">{stat.label}</div>
    </div>
  );
}

/* ── Main page ── */

export function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollToFeatures = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToStats = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="lk-root">
      {/* Navbar */}
      <nav className="lk-nav">
        <div className="lk-nav-inner">
          <div className="lk-nav-left">
            <div className="lk-nav-logo">
              <IconCheck />
            </div>
            <span className="lk-nav-brand">ForgeKey</span>
          </div>
          <div className="lk-nav-center">
            <a href="#features" className="lk-nav-link" onClick={scrollToFeatures}>Features</a>
            <a href="#stats" className="lk-nav-link" onClick={scrollToStats}>Metrics</a>
          </div>
          <div className="lk-nav-right">
            <button className="lk-btn lk-btn-secondary" onClick={onSignIn}>Sign In</button>
            <button className="lk-btn lk-btn-primary" onClick={onSignIn}>
              Get Started
              <IconArrowRight />
            </button>
            <button className="lk-btn-mobile" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              <IconMenu />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lk-mobile-menu lk-open">
            <a href="#features" onClick={(e) => { e.preventDefault(); setMobileOpen(false); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
            <a href="#stats" onClick={(e) => { e.preventDefault(); setMobileOpen(false); document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" }); }}>Metrics</a>
            <div className="lk-mobile-divider" />
            <button className="lk-btn lk-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={onSignIn}>
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="lk-hero">
        <div className="lk-blob lk-blob-1" />
        <div className="lk-blob lk-blob-2" />
        <div className="lk-blob lk-blob-3" />

        <div className="lk-hero-content">
          <div className="lk-badge lk-hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="15" r="4" />
              <line x1="10.85" y1="12.15" x2="19" y2="4" />
              <line x1="18" y1="5" x2="20" y2="7" />
              <line x1="15" y1="8" x2="17" y2="10" />
            </svg>
            ForgeKey License Manager
          </div>

          <h1 className="lk-hero-title">
            <span className="lk-hero-title-white">License infrastructure</span>
            <span className="lk-hero-title-accent">built for scale.</span>
          </h1>

          <p className="lk-hero-sub">
            Generate keys, manage customers, configure plans, track payments, and verify registrations — from one unified dashboard.
          </p>

          <div className="lk-hero-actions">
            <button className="lk-btn lk-btn-primary lk-btn-lg" onClick={onSignIn}>
              Get Started
              <IconArrowRight />
            </button>
            <button className="lk-btn lk-btn-secondary lk-btn-lg" onClick={onSignIn}>
              View Dashboard
            </button>
          </div>

          {/* Floating card mockup */}
          <div className="lk-floating-card">
            <div className="lk-card-top">
              <div className="lk-card-dot" />
              <span className="lk-card-label">License Key Generated</span>
              <span className="lk-card-time">2m ago</span>
            </div>
            <div className="lk-card-key">FRGK-4F2B-8A1C-9D7E</div>
            <div className="lk-card-meta">
              <span>Plan: Enterprise</span>
              <div className="lk-card-meta-dot" />
              <span>Customer: acme.co</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lk-scroll-indicator">
          <span className="lk-scroll-text">Scroll</span>
          <div className="lk-scroll-chevron">
            <IconChevronDown />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="stats" className="lk-stats" ref={statsRef}>
        <div className="lk-stats-inner">
          {STATS_DATA.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 80}>
              <CountUpStat stat={stat} visible={statsVisible} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lk-features">
        <ScrollReveal>
          <div className="lk-section-header">
            <div className="lk-badge lk-section-badge">Capabilities</div>
            <h2 className="lk-section-title">Everything you need to manage licenses</h2>
            <p className="lk-section-sub">From key generation to customer management — a complete toolkit for software licensing operations.</p>
          </div>
        </ScrollReveal>

        <div className="lk-features-grid">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.num} feature={feature} index={i} />
          ))}
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="lk-divider">
        <div className="lk-divider-grid">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#F59E0B" opacity="0.3">
                  <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
                </circle>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotGrid)" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={200 + i * 160} cy={100 + (i % 2 === 0 ? -30 : 30)} r="2" fill="#F59E0B" opacity="0.2">
                <animate attributeName="cy" values={`${100 + (i % 2 === 0 ? -30 : 30)};${100 + (i % 2 === 0 ? -20 : 20)};${100 + (i % 2 === 0 ? -30 : 30)}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
        </div>
        <div className="lk-divider-text">
          &ldquo;Trusted by 2,400+ software teams worldwide.&rdquo;
        </div>
      </div>

      {/* CTA */}
      <section className="lk-cta">
        <div className="lk-cta-blob" />
        <div className="lk-cta-content">
          <ScrollReveal>
            <h2 className="lk-cta-title">Ready to launch?</h2>
            <p className="lk-cta-sub">Sign in to start managing your product keys and customers.</p>
            <div className="lk-cta-btn">
              <button className="lk-btn lk-btn-primary lk-btn-lg" onClick={onSignIn}>
                Sign In to Dashboard
                <IconArrowRight />
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="lk-footer">
        <div className="lk-footer-inner">
          <div className="lk-footer-top">
            <div className="lk-footer-brand">
              <div className="lk-footer-logo">
                <IconCheck />
              </div>
              <div>
                <div className="lk-footer-name">ForgeKey</div>
                <div className="lk-footer-tag">License Management</div>
              </div>
            </div>
            <div className="lk-footer-links">
              {FOOTER_LINKS.map((link) => (
                <a key={link.label} href="#" className="lk-footer-link">{link.label}</a>
              ))}
            </div>
          </div>
          <div className="lk-footer-bottom">
            &copy; {new Date().getFullYear()} ForgeKey. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
