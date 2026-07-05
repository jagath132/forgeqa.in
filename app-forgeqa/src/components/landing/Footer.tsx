import { ArrowUp, Mail, Shield, Server, Globe } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "AI Test Generation", href: "#" },
  { label: "Cross-Browser Testing", href: "#" },
  { label: "Mobile Automation", href: "#" },
  { label: "API Testing", href: "#" },
  { label: "CI/CD Integration", href: "#" },
  { label: "Pricing", href: "#pricing" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#enquiry" },
  { label: "Brand Kit", href: "#" },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "#" },
  { label: "API Reference", href: "#" },
  { label: "Community", href: "#" },
  { label: "Tutorials", href: "#" },
  { label: "Status Page", href: "#" },
  { label: "Release Notes", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security", href: "#" },
  { label: "Compliance", href: "#" },
  { label: "DPA", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "GitHub", href: "#", color: "#333" },
  { label: "Twitter / X", href: "#", color: "#1DA1F2" },
  { label: "LinkedIn", href: "#", color: "#0A66C2" },
  { label: "YouTube", href: "#", color: "#FF0000" },
  { label: "Email", href: "mailto:hello@forgeqa.com", color: "#EA4335" },
];

const BADGES = [
  { icon: Shield, label: "SOC 2 Compliant" },
  { icon: Server, label: "99.9% Uptime SLA" },
  { icon: Globe, label: "GDPR Compliant" },
];

function SocialIcon({ label }: { label: string; color: string }) {
  const svgProps = { className: "w-3.5 h-3.5", fill: "currentColor", viewBox: "0 0 24 24" };

  if (label === "GitHub") {
    return (
      <svg {...svgProps}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (label === "Twitter / X") {
    return (
      <svg {...svgProps}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (label === "LinkedIn") {
    return (
      <svg {...svgProps}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (label === "YouTube") {
    return (
      <svg {...svgProps}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return <Mail {...svgProps} />;
}

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer style={{ background: "var(--landing-bg)", borderTop: "1px solid var(--landing-glass-border)", position: "relative" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--neon-blue), var(--neon-cyan), var(--neon-violet), transparent)", opacity: 0.2 }} />

      <button
        onClick={scrollToTop}
        className="absolute -top-4 right-8 flex items-center justify-center rounded-full cursor-pointer transition-all"
        style={{
          width: 36,
          height: 36,
          background: "var(--landing-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--landing-glass-border)",
          color: "var(--landing-text-secondary)",
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--neon-blue)"; e.currentTarget.style.borderColor = "var(--neon-blue)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--landing-text-secondary)"; e.currentTarget.style.borderColor = "var(--landing-glass-border)"; }}
        aria-label="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      <div className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingTop: "4rem", paddingBottom: 0 }}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <svg width={28} height={28} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="f-footer" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="34" height="34" rx="10" fill="url(#f-footer)" fillOpacity="0.12" stroke="url(#f-footer)" strokeWidth="1.5" />
                <text x="18" y="24" textAnchor="middle" fill="url(#f-footer)" fontFamily="'Space Grotesk','Inter',sans-serif" fontWeight="800" fontSize="20">F</text>
              </svg>
              <span style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
                Forge<span style={{ color: "var(--neon-blue)" }}>QA</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: "var(--landing-text-muted)" }}>
              AI-powered test automation platform. Generate, execute, and manage automated test suites across web, mobile, API, and desktop — all from one unified dashboard.
            </p>

            <div className="flex gap-2 pt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex items-center justify-center rounded-lg transition-all no-underline"
                  style={{ width: 32, height: 32, color: "var(--landing-text-muted)", background: "transparent", border: "1px solid var(--landing-glass-border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = s.color; e.currentTarget.style.borderColor = s.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--landing-text-muted)"; e.currentTarget.style.borderColor = "var(--landing-glass-border)"; }}
                  aria-label={s.label}
                >
                  <SocialIcon label={s.label} color={s.color} />
                </a>
              ))}
            </div>
          </div>

          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
          <LinkColumn title="Resources" links={RESOURCE_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 py-6 mt-8" style={{ borderTop: "1px solid var(--landing-glass-border)" }}>
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--landing-text-muted)" }}>
                <Icon className="w-3 h-3" style={{ color: "var(--neon-emerald)" }} />
                {badge.label}
              </div>
            );
          })}
        </div>

        <div className="py-5 flex items-center justify-center gap-3" style={{ borderTop: "1px solid var(--landing-glass-border)" }}>
          <p className="text-xs" style={{ color: "var(--landing-text-muted)" }}>
            &copy; {new Date().getFullYear()} ForgeQA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--landing-text-muted)" }}>{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm no-underline transition-all"
              style={{ color: "var(--landing-text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--neon-blue)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--landing-text-secondary)"; }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
