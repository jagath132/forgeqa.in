import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore, getProviderLabel } from "../store/useAppStore";
import { Logo } from "./ui/Logo";
import { UserDropdown } from "./UserDropdown";
import { GlobalSearch } from "./GlobalSearch";

const navItems = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", color: "violet" },
  { key: "generator", label: "Generator", path: "/generator", color: "rose" },
  { key: "test-scripts", label: "Scripts", path: "/test-scripts", color: "emerald" },
  { key: "knowledge", label: "Knowledge", path: "/knowledge", color: "cyan" },
  { key: "regression", label: "Regression", path: "/regression", color: "violet" },
  { key: "ai-settings", label: "AI Settings", path: "/ai-settings", color: "amber" },
] as const;

const pageMeta: Record<string, { title: string; description: string; badge: string; badgeClass: string; gradient: string }> = {
  dashboard: { title: "Command Center", description: "Monitor test generation activity, review knowledge coverage metrics, and navigate to key workflows from a single pane.", badge: "Dashboard", badgeClass: "badge-violet", gradient: "var(--gradient-primary)" },
  generator: { title: "Test Case Generator", description: "Submit product requirements and generate comprehensive test matrices powered by LLM inference and contextual knowledge retrieval.", badge: "Generation Engine", badgeClass: "badge-rose", gradient: "var(--gradient-rose)" },
  "test-scripts": { title: "Automation Script Studio", description: "Translate validated test cases into executable automation code for leading testing frameworks.", badge: "Script Studio", badgeClass: "badge-amber", gradient: "var(--gradient-warm)" },
  knowledge: { title: "Knowledge Base Manager", description: "Ingest, parse, and vectorize project documents to enrich prompt context for every generation cycle.", badge: "Knowledge Vault", badgeClass: "badge-cyan", gradient: "var(--gradient-cyan)" },
  "ai-settings": { title: "Provider Configuration", description: "Manage AI provider connections, rotate credentials, and select inference models for the generation pipeline.", badge: "Infrastructure", badgeClass: "badge-amber", gradient: "var(--gradient-warm)" },
  profile: { title: "Profile & Team", description: "Manage your account, team members, and workspace preferences.", badge: "Account", badgeClass: "badge-primary", gradient: "var(--gradient-primary)" },
  admin: { title: "Admin Panel", description: "Manage users, view system statistics, and configure platform settings.", badge: "Admin", badgeClass: "badge-warning", gradient: "var(--gradient-rose)" },
  analytics: { title: "Analytics", description: "Visualize generation trends, case coverage, and provider usage over time.", badge: "Insights", badgeClass: "badge-violet", gradient: "var(--gradient-primary)" },
  suites: { title: "Test Suites", description: "Organize test cases into plans, folders, and suites by feature or sprint.", badge: "Organization", badgeClass: "badge-rose", gradient: "var(--gradient-rose)" },
  regression: { title: "Regression Testing", description: "Generate regression test suites, create automation scripts, and run tests against APK or web builds.", badge: "Regression", badgeClass: "badge-violet", gradient: "var(--gradient-primary)" },
};

function NavLink({ item, active, onClick }: { item: typeof navItems[number]; active: boolean; onClick: () => void }) {
  const accentVar = `var(--accent-${item.color})`;
  return (
    <button onClick={onClick} type="button"
      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
        active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
      }`}
      style={{ color: active ? accentVar : "var(--text-secondary)" }}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: accentVar }} />}
      <span>{item.label}</span>
    </button>
  );
}

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const navDrawerOpen = useAppStore((s) => s.navDrawerOpen);
  const setNavDrawerOpen = useAppStore((s) => s.setNavDrawerOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const sessionUser = useAppStore((s) => s.user);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);

  const activeKey = location.pathname.replace("/", "") || "dashboard";
  const meta = pageMeta[activeKey] ?? pageMeta.dashboard;
  const hasSavedKey = provider ? !!savedProviderKeys[provider] : false;
  const providerLabel = getProviderLabel(provider);

  function handleNav(path: string) {
    navigate(path);
    setNavDrawerOpen(false);
    setSidebarOpen(false);
  }

  return (
    <>
      <GlobalSearch />
      <header className="sticky top-0 z-30 border-b" style={{ background: "var(--bg-glass)", borderColor: "var(--border-default)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-4 lg:gap-6">
            <button onClick={() => setNavDrawerOpen(!navDrawerOpen)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg btn-ghost cursor-pointer" type="button" aria-label="Toggle navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <button onClick={() => handleNav("/dashboard")} type="button" className="cursor-pointer">
              <Logo variant="mark" />
            </button>
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.key} item={item} active={activeKey === item.key} onClick={() => handleNav(item.path)} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} type="button"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>⌘K</kbd></span>
            </button>
            <button onClick={() => setSearchOpen(true)} type="button"
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-lg btn-ghost cursor-pointer" aria-label="Search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: "var(--bg-tertiary)" }}>
              <span className={`relative flex h-2 w-2`}>
                <span className={`absolute inline-flex h-full w-full rounded-full animate-ping ${hasSavedKey ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${hasSavedKey ? "bg-emerald-500" : "bg-amber-500"}`} />
              </span>
              <span className="hidden lg:inline" style={{ color: "var(--text-muted)" }}>{providerLabel}</span>
            </div>
            <button onClick={toggleTheme} type="button"
              className="h-9 w-9 flex items-center justify-center rounded-lg btn-ghost cursor-pointer" aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-amber)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-amber)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              )}
            </button>
            <UserDropdown />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-6 pb-2.5">
          <span className={`badge ${meta.badgeClass} text-xs`}>{meta.badge}</span>
          <h1 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{meta.title}</h1>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>— {meta.description}</span>
        </div>
      </header>

      {navDrawerOpen && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setNavDrawerOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 h-full w-64 border-r animate-slide-in" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
              <Logo variant="mark" />
              <button onClick={() => setNavDrawerOpen(false)} type="button" className="h-8 w-8 flex items-center justify-center rounded-lg btn-ghost cursor-pointer" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const accentVar = `var(--accent-${item.color})`;
                const isActive = activeKey === item.key;
                return (
                  <button key={item.key} onClick={() => handleNav(item.path)} type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                    }`}
                    style={{ color: isActive ? accentVar : "var(--text-secondary)" }}
                  >
                    <span className="flex h-2 w-2 rounded-full" style={{ background: isActive ? accentVar : "var(--border-default)" }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t my-3" style={{ borderColor: "var(--border-default)" }} />
              <button onClick={() => handleNav("/analytics")} type="button"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeKey === "analytics" ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                }`}
                style={{ color: activeKey === "analytics" ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                <span>Analytics</span>
              </button>
              <button onClick={() => handleNav("/regression")} type="button"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeKey === "regression" ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                }`}
                style={{ color: activeKey === "regression" ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span>Regression</span>
              </button>
              <button onClick={() => handleNav("/suites")} type="button"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeKey === "suites" ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                }`}
                style={{ color: activeKey === "suites" ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                <span>Test Suites</span>
              </button>
              <button onClick={() => handleNav("/profile")} type="button"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeKey === "profile" ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                }`}
                style={{ color: activeKey === "profile" ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span>Profile & Team</span>
              </button>
              {sessionUser?.role === "Admin" && (
                <button onClick={() => handleNav("/admin")} type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeKey === "admin" ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-tertiary)]"
                  }`}
                  style={{ color: activeKey === "admin" ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
