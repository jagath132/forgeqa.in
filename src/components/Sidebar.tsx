import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore, getProviderLabel } from "../store/useAppStore";
import { Logo } from "./ui/Logo";
import { UserProfile } from "./UserProfile";
import { DashboardIcon3D, GeneratorIcon3D, ScriptsIcon3D, KnowledgeIcon3D, SettingsIcon3D } from "./ui/Icons3D";

function NavButton({ active, label, onClick, icon, color }: { active: boolean; label: string; onClick: () => void; icon: React.ReactNode; color: string }) {
  const cls = `nav-link ${active ? `nav-link-${color} active` : ""}`;
  const accentVar = `var(--accent-${color})`;
  return (
    <button className={cls} onClick={onClick} type="button">
      <span style={{ color: active ? accentVar : "var(--text-muted)" }}>{icon}</span>
      <span style={{ color: active ? accentVar : undefined }}>{label}</span>
    </button>
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
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
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

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavButton active={activeKey === "dashboard"} color="violet" label="Dashboard" onClick={() => navigateToPage("/dashboard")}
          icon={<DashboardIcon3D size={20} />}
        />
        <NavButton active={activeKey === "generator"} color="rose" label="Test Case Generator" onClick={() => navigateToPage("/generator")}
          icon={<GeneratorIcon3D size={20} />}
        />
        <NavButton active={activeKey === "test-scripts"} color="emerald" label="Automation Scripts" onClick={() => navigateToPage("/test-scripts")}
          icon={<ScriptsIcon3D size={20} />}
        />
        <NavButton active={activeKey === "knowledge"} color="cyan" label="Knowledge Base" onClick={() => navigateToPage("/knowledge")}
          icon={<KnowledgeIcon3D size={20} />}
        />
        <NavButton active={activeKey === "ai-settings"} color="amber" label="AI Configuration" onClick={() => navigateToPage("/ai-settings")}
          icon={<SettingsIcon3D size={20} />}
        />
        {user?.role === "Admin" && (
          <NavButton active={activeKey === "admin"} color="rose" label="Admin Panel" onClick={() => navigateToPage("/admin")}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
          />
        )}
      </nav>

      <div className="px-3 py-2">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-lg p-4" style={{
          background: hasSavedApiKeyForProvider ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(6,182,212,0.05))" : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(244,63,94,0.05))",
          border: `1px solid ${hasSavedApiKeyForProvider ? "color-mix(in srgb, var(--accent-emerald) 25%, transparent)" : "color-mix(in srgb, var(--accent-amber) 25%, transparent)"}`,
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

      {user && (
        <UserProfile
          user={user}
          onRequestLogout={handleLogout}
        />
      )}
    </aside>
  );
}
