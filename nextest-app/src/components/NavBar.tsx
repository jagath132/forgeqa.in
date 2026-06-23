import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Logo } from "./ui/Logo";
import { UserDropdown } from "./UserDropdown";
import { GlobalSearch } from "./GlobalSearch";

export function NavBar() {
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  const isDark = theme === "dark";

  const ink = isDark ? "#E7E9EE" : "#0F172A";
  const muted = isDark ? "#8A93A6" : "#64748B";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <>
      <style>{`
        .nav-focus-visible:focus-visible {
          outline: 2px solid var(--signal-green);
          outline-offset: 2px;
          border-radius: 8px;
        }
      `}</style>
      <GlobalSearch />
      <header style={{
        height: 52,
        background: isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.2)"
          : "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div className="flex items-center h-full px-4 lg:px-6 gap-2">
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-xl cursor-pointer shrink-0 nav-focus-visible" type="button" aria-label="Open sidebar"
            style={{ color: muted }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo */}
          <button onClick={() => navigate("/dashboard")} type="button"
            className="flex items-center gap-2.5 cursor-pointer shrink-0 nav-focus-visible"
            style={{ padding: "6px 6px 6px 2px", borderRadius: 10 }}
          >
            <Logo variant="mark" />
            <span className="hidden lg:inline text-sm font-bold" style={{ color: ink, letterSpacing: "-0.01em" }}>NexTest</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search trigger */}
          <button onClick={() => setSearchOpen(true)} type="button"
            className="flex items-center gap-2.5 cursor-pointer nav-focus-visible shrink-0 group"
            style={{
              padding: "7px 14px",
              border: `1px solid ${border}`,
              borderRadius: 12,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              color: muted,
              fontSize: 13,
              fontWeight: 400,
              fontFamily: "inherit",
              outline: "none",
              minWidth: 200,
              transition: "border-color 150ms ease-out, background 150ms ease-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = border;
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--signal-green)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = border; }}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">Search...</span>
            <kbd style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 5,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: muted,
              border: `1px solid ${border}`,
            }}>
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} type="button"
            className="flex items-center justify-center cursor-pointer nav-focus-visible shrink-0"
            style={{
              width: 34, height: 34,
              borderRadius: 10,
              color: muted,
              background: "transparent",
              border: "none",
              transition: "color 150ms ease-out, background 150ms ease-out",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = ink;
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = muted;
              e.currentTarget.style.background = "transparent";
            }}
          >
            {theme === "light" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364l-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0l-1.591-1.591M7.227 7.227L5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            )}
          </button>

          {/* User avatar + dropdown */}
          <UserDropdown />
        </div>
      </header>
    </>
  );
}
