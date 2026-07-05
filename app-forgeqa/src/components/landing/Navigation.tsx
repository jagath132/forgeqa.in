import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { href: "features", label: "Features" },
  { href: "workflow", label: "Workflow" },
  { href: "pricing", label: "Pricing" },
  { href: "faq", label: "FAQ" },
  { href: "contact", label: "Contact" },
];

interface NavigationProps {
  isAuthed: boolean;
  onGetStarted: () => void;
  onSignIn?: () => void;
}

export default function Navigation({ isAuthed, onGetStarted, onSignIn }: NavigationProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogoClick = () => {
    navigate(isAuthed ? "/dashboard" : "/");
    setMobileOpen(false);
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer border-none bg-transparent p-0"
            style={{ outline: "none" }}
            aria-label="ForgeQA Home"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
              }}
            >
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>F</span>
            </div>
            <span style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
              Forge<span style={{ color: "var(--neon-blue)" }}>QA</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={`#${link.href}`}
                onClick={scrollTo(link.href)}
                className="px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 no-underline"
                style={{ color: "var(--landing-text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--landing-text)";
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--landing-text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthed ? (
              <button
                onClick={onGetStarted}
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)"; }}
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    color: "var(--landing-text-secondary)",
                    background: "transparent",
                    border: "1px solid var(--landing-glass-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--landing-text)";
                    e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--landing-text-secondary)";
                    e.currentTarget.style.borderColor = "var(--landing-glass-border)";
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)"; }}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
            className="md:hidden flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
            style={{
              width: 40,
              height: 40,
              color: "var(--landing-text)",
              background: mobileOpen ? "rgba(59,130,246,0.08)" : "transparent",
              border: mobileOpen ? "1px solid rgba(59,130,246,0.15)" : "1px solid transparent",
            }}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />

        {/* Menu panel */}
        <div
          className="absolute top-16 left-0 right-0 p-6 transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            transform: mobileOpen ? "translateY(0)" : "translateY(-10px)",
          }}
        >
          <div className="space-y-1">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={`#${link.href}`}
                onClick={scrollTo(link.href)}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 no-underline"
                style={{ color: "var(--landing-text)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {link.label}
                <ChevronRight className="w-4 h-4" style={{ color: "var(--landing-text-muted)" }} />
              </a>
            ))}
          </div>

          <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {isAuthed ? (
              <button
                onClick={onGetStarted}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                  color: "#fff",
                  border: "none",
                }}
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  type="button"
                  className="w-full py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    color: "var(--landing-text)",
                    background: "transparent",
                    border: "1px solid var(--landing-glass-border)",
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
