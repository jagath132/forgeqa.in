import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore, getProviderLabel } from "../store/useAppStore";
import { Logo } from "./ui/Logo";
import { UserProfile } from "./UserProfile";
import {
  DashboardIcon3D, GeneratorIcon3D, ScriptsIcon3D,
  KnowledgeIcon3D, SettingsIcon3D,
} from "./ui/Icons3D";

type NavColor = "violet" | "rose" | "emerald" | "cyan" | "amber";

function NavButton({ active, label, onClick, icon, color }: {
  active: boolean; label: string; onClick: () => void;
  icon: React.ReactNode; color: NavColor;
}) {
  const cls = `nav-link ${active ? `nav-link-${color} active` : ""}`;
  const accentVar = `var(--accent-${color})`;
  return (
    <button className={cls} onClick={onClick} type="button">
      <span style={{ color: active ? accentVar : "var(--text-muted)" }}>{icon}</span>
      <span style={{ color: active ? accentVar : undefined }}>{label}</span>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5">
      <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const isLight = theme === "light";
  return (
    <button aria-label={`Switch to ${isLight ? "dark" : "light"} theme`} onClick={onToggle} className="nav-link justify-between" type="button">
      <span className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "var(--accent-soft)" }}>
          {isLight ? (
            <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{isLight ? "Light Mode" : "Dark Mode"}</span>
      </span>
    </button>
  );
}

function InlineSvg({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  regression: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  analytics: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  suites: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  admin: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
};

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const user = useAppStore((s) => s.user);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);

  const activeKey = location.pathname.replace("/", "") || "dashboard";
  const hasSavedApiKeyForProvider = provider ? !!savedProviderKeys[provider] : false;

  function navigateToPage(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const selectedProviderLabel = getProviderLabel(provider);

  function handleLogout() {
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-30 flex flex-col w-64 h-full shrink-0 border-r transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
    >
      {/* Logo header */}
      <div className="flex items-center justify-between gap-3 px-5 border-b shrink-0" style={{ borderColor: "var(--border-default)", height: 52 }}>
        <Logo variant="wordmark" />
        <button
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg btn-ghost"
          onClick={() => setSidebarOpen(false)}
          type="button"
          aria-label="Close sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto" style={{ paddingTop: 4, paddingBottom: 8 }}>
        {/* Dashboard */}
        <div className="py-1">
          <NavButton active={activeKey === "dashboard"} color="violet" label="Dashboard" onClick={() => navigateToPage("/dashboard")}
            icon={<DashboardIcon3D size={20} />}
          />
        </div>

        {/* Build section */}
        <SectionHeader label="Build" />
        <div className="py-1 space-y-0.5">
          <NavButton active={activeKey === "generator"} color="rose" label="Generator" onClick={() => navigateToPage("/generator")}
            icon={<GeneratorIcon3D size={20} />}
          />
          <NavButton active={activeKey === "test-scripts"} color="emerald" label="Scripts" onClick={() => navigateToPage("/test-scripts")}
            icon={<ScriptsIcon3D size={20} />}
          />
          <NavButton active={activeKey === "knowledge"} color="cyan" label="Knowledge" onClick={() => navigateToPage("/knowledge")}
            icon={<KnowledgeIcon3D size={20} />}
          />
        </div>

        {/* Monitor section */}
        <SectionHeader label="Monitor" />
        <div className="py-1 space-y-0.5">
          <NavButton active={activeKey === "regression"} color="violet" label="Regression" onClick={() => navigateToPage("/regression")}
            icon={<InlineSvg path={ICONS.regression} size={20} />}
          />
          <NavButton active={activeKey === "analytics"} color="amber" label="Analytics" onClick={() => navigateToPage("/analytics")}
            icon={<InlineSvg path={ICONS.analytics} size={20} />}
          />
          <NavButton active={activeKey === "suites"} color="cyan" label="Suites" onClick={() => navigateToPage("/suites")}
            icon={<InlineSvg path={ICONS.suites} size={20} />}
          />
        </div>

        {/* System section */}
        <SectionHeader label="System" />
        <div className="py-1 space-y-0.5">
          <NavButton active={activeKey === "settings"} color="amber" label="Settings" onClick={() => navigateToPage("/settings")}
            icon={<SettingsIcon3D size={20} />}
          />
          {user?.role === "Admin" && (
            <NavButton active={activeKey === "admin"} color="rose" label="Admin" onClick={() => navigateToPage("/admin")}
              icon={<InlineSvg path={ICONS.admin} size={20} />}
            />
          )}
        </div>
      </nav>

      {/* AI Engine card */}
      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-lg p-4" style={{
          background: hasSavedApiKeyForProvider
            ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(6,182,212,0.05))"
            : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(244,63,94,0.05))",
          border: `1px solid ${
            hasSavedApiKeyForProvider
              ? "color-mix(in srgb, var(--accent-emerald) 25%, transparent)"
              : "color-mix(in srgb, var(--accent-amber) 25%, transparent)"
          }`,
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full animate-ping ${hasSavedApiKeyForProvider ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasSavedApiKeyForProvider ? "bg-emerald-500" : "bg-amber-500"}`} />
            </span>
            <p className="text-xs font-semibold" style={{ color: hasSavedApiKeyForProvider ? "var(--accent-emerald)" : "var(--accent-amber)" }}>AI Engine</p>
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{selectedProviderLabel}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {hasSavedApiKeyForProvider ? "API key loaded and encrypted." : "No saved API key. Configure in Settings."}
          </p>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-1 shrink-0">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* User profile */}
      {user && (
        <UserProfile
          user={user}
          onRequestLogout={handleLogout}
        />
      )}
    </aside>
  );
}
